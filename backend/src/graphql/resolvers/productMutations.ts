import { GraphQLError } from "graphql";
import { logger } from "../lib/logger";

export const productMutations = {
  // Create single product
  async createProduct(parent: any, args: any, context: any) {
    const { input } = args;
    context.security.requireStaff(context);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    // Validate required fields
    if (!input.product_name || !input.sale_price) {
      throw new GraphQLError('Product name and sale price are required');
    }
    
    // Sanitize input
    const sanitizedInput = {
      ...input,
      product_name: context.security.sanitizeString(input.product_name),
      generic_name: input.generic_name ? context.security.sanitizeString(input.generic_name) : null,
      short_name: input.short_name ? context.security.sanitizeString(input.short_name) : null,
      status: input.status || 'active',
      vat_percent: input.vat_percent || 0,
      stock_quantity: input.stock_quantity || 0
    };
    
    try {
      // Use transaction to create product and initial stock
      const result = await context.prisma.$transaction(async (tx: any) => {
        const product = await tx.product.create({
          data: sanitizedInput
        });
        
        // Create initial stock record if stock_quantity > 0
        if (sanitizedInput.stock_quantity > 0) {
          await tx.stock.create({
            data: {
              productId: product.id,
              quantity: sanitizedInput.stock_quantity,
              quantity_in: sanitizedInput.stock_quantity,
              is_outofstock: false,
              note: 'Initial stock entry',
              createdByUserId: context.userId,
              created_by_username: context.user?.username || 'Unknown',
              product_name: product.product_name,
              product_unit: product.unit,
              created_at: new Date()
            }
          });
        }
        
        return product;
      });
      
      await context.security.logSensitiveOperation(
        context.userId,
        'CREATE_PRODUCT',
        'Product',
        result.id,
        { product_name: result.product_name, sku: result.sku },
        context.redisClient
      );
      
      return result;
    } catch (error) {
      logger.error('Failed to create product', error, 'GRAPHQL');
      throw new GraphQLError('Failed to create product');
    }
  },

  // Bulk import products
  async bulkImportProducts(parent: any, args: any, context: any) {
    const { input } = args;
    const { products, settings } = input;
    
    context.security.requireStaff(context);
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    logger.info('Starting bulk import', { 
      productsCount: products.length, 
      settings,
      userId: context.userId 
    }, 'IMPORT');
    
    const results: any[] = [];
    let imported = 0;
    let failed = 0;
    let skipped = 0;
    const errors: string[] = [];
    
    // Create backup if requested
    if (settings?.createBackup) {
      try {
        logger.info('Creating backup before import', {}, 'IMPORT');
        // In a real implementation, you would create a backup here
        // await createDatabaseBackup();
      } catch (error) {
        logger.error('Failed to create backup', error, 'IMPORT');
        errors.push('Failed to create backup, continuing with import...');
      }
    }
    
    // Process each product
    for (const productData of products) {
      try {
        // Validate required fields
        if (!productData.product_name || !productData.sale_price) {
          failed++;
          const errorMsg = `Missing required fields for product: ${productData.product_name || 'Unknown'}`;
          errors.push(errorMsg);
          results.push({
            status: 'FAILED',
            error: errorMsg,
            product_name: productData.product_name || 'Unknown',
            sku: productData.sku
          });
          continue;
        }

        // Validate categoryId if provided
        if (productData.categoryId) {
          const categoryExists = await context.prisma.category.findUnique({
            where: { id: productData.categoryId }
          });
          if (!categoryExists) {
            failed++;
            const errorMsg = `Category not found: ${productData.categoryId}`;
            errors.push(errorMsg);
            results.push({
              status: 'FAILED',
              error: errorMsg,
              product_name: productData.product_name,
              sku: productData.sku
            });
            continue;
          }
        }
        
        // Check for duplicates if skipDuplicates is enabled
        if (settings?.skipDuplicates) {
          const existingProduct = await context.prisma.product.findFirst({
            where: {
              OR: [
                { product_name: productData.product_name },
                productData.sku ? { sku: productData.sku } : {},
                productData.barcode ? { barcode: productData.barcode } : {}
              ].filter(condition => Object.keys(condition).length > 0)
            }
          });
          
          if (existingProduct) {
            if (settings?.updateExisting) {
              // Update existing product
              try {
                const updatedProduct = await context.prisma.product.update({
                  where: { id: existingProduct.id },
                  data: {
                    ...productData,
                    product_name: context.security.sanitizeString(productData.product_name),
                    generic_name: productData.generic_name ? context.security.sanitizeString(productData.generic_name) : null,
                    short_name: productData.short_name ? context.security.sanitizeString(productData.short_name) : null,
                    updated_at: new Date()
                  }
                });
                
                imported++;
                results.push({
                  product: updatedProduct,
                  status: 'UPDATED',
                  product_name: updatedProduct.product_name,
                  sku: updatedProduct.sku
                });
              } catch (updateError) {
                failed++;
                const errorMsg = `Failed to update existing product: ${productData.product_name}`;
                errors.push(errorMsg);
                results.push({
                  status: 'FAILED',
                  error: errorMsg,
                  product_name: productData.product_name,
                  sku: productData.sku
                });
              }
            } else {
              skipped++;
              results.push({
                status: 'SKIPPED',
                error: 'Product already exists',
                product_name: productData.product_name,
                sku: productData.sku
              });
            }
            continue;
          }
        }
        
        // Sanitize input
        const sanitizedInput = {
          ...productData,
          product_name: context.security.sanitizeString(productData.product_name),
          generic_name: productData.generic_name ? context.security.sanitizeString(productData.generic_name) : null,
          short_name: productData.short_name ? context.security.sanitizeString(productData.short_name) : null,
          status: productData.status || 'active',
          vat_percent: productData.vat_percent || 0,
          stock_quantity: productData.stock_quantity || 0,
          created_at: new Date(),
          updated_at: new Date()
        };
        
        // Create new product and initial stock using transaction
        const result = await context.prisma.$transaction(async (tx: any) => {
          const newProduct = await tx.product.create({
            data: sanitizedInput
          });
          
          // Create initial stock record if stock_quantity > 0
          if (sanitizedInput.stock_quantity > 0) {
            await tx.stock.create({
              data: {
                productId: newProduct.id,
                quantity: sanitizedInput.stock_quantity,
                quantity_in: sanitizedInput.stock_quantity,
                is_outofstock: false,
                production_date: productData.production_date || null,
                expiration_date: productData.expiration_date || null,
                note: 'Initial stock from bulk import',
                createdByUserId: context.userId,
                created_by_username: context.user?.username || 'Unknown',
                product_name: newProduct.product_name,
                product_unit: newProduct.unit,
                created_at: new Date()
              }
            });
          }
          
          return newProduct;
        });
        
        imported++;
        results.push({
          product: result,
          status: 'CREATED',
          product_name: result.product_name,
          sku: result.sku
        });
        
      } catch (error) {
        failed++;
        const errorMsg = `Failed to process product: ${productData.product_name} - ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        results.push({
          status: 'FAILED',
          error: errorMsg,
          product_name: productData.product_name,
          sku: productData.sku
        });
        logger.error('Failed to import product', { productData, error }, 'IMPORT');
      }
    }
    
    // Log audit trail
    await context.security.logSensitiveOperation(
      context.userId,
      'BULK_IMPORT_PRODUCTS',
      'Product',
      'bulk',
      { 
        totalProducts: products.length,
        imported,
        failed,
        skipped,
        settings
      },
      context.redisClient
    );
    
    const success = failed === 0;
    const message = success 
      ? `Successfully imported ${imported} products`
      : `Import completed with ${failed} failures. ${imported} products imported successfully.`;
    
    logger.info('Bulk import completed', { 
      imported, 
      failed, 
      skipped, 
      success 
    }, 'IMPORT');
    
    return {
      success,
      message,
      imported,
      failed,
      skipped,
      errors: errors.slice(0, 10), // Limit errors to prevent large responses
      results
    };
  },

  // Update product
  async updateProduct(parent: any, args: any, context: any) {
    const { id, input } = args;
    context.security.requireStaff(context);
    context.security.validateId(id);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    // Check if product exists
    const existingProduct = await context.prisma.product.findUnique({
      where: { id }
    });
    
    if (!existingProduct) {
      throw new GraphQLError('Product not found');
    }
    
    // Check for duplicate SKU or barcode if provided and different from existing
    logger.debug('UpdateProduct - Checking SKU/barcode', {
      inputSku: input.sku,
      inputBarcode: input.barcode,
      existingSku: existingProduct.sku,
      existingBarcode: existingProduct.barcode
    }, 'GRAPHQL')
    
    if (input.sku || input.barcode) {
      const whereConditions: any[] = []
      
      if (input.sku && input.sku !== existingProduct.sku) {
        whereConditions.push({ sku: input.sku })
      }
      
      if (input.barcode && input.barcode !== existingProduct.barcode) {
        whereConditions.push({ barcode: input.barcode })
      }
      
              if (whereConditions.length > 0) {
          logger.debug('UpdateProduct - Checking for duplicates', { whereConditions }, 'GRAPHQL')
          const duplicate = await context.prisma.product.findFirst({
            where: {
              OR: whereConditions
            }
          });
          
          if (duplicate) {
            logger.info('UpdateProduct - Found duplicate SKU/barcode', { duplicate, whereConditions }, 'GRAPHQL')
            throw new GraphQLError('Product with this SKU or barcode already exists');
          }
        }
    }
    
    // Sanitize input
    const sanitizedInput = {
      ...input,
      product_name: input.product_name ? context.security.sanitizeString(input.product_name) : undefined,
      generic_name: input.generic_name ? context.security.sanitizeString(input.generic_name) : undefined,
      short_name: input.short_name ? context.security.sanitizeString(input.short_name) : undefined,
      updated_at: new Date()
    };
    
    try {
      const updatedProduct = await context.prisma.product.update({
        where: { id },
        data: sanitizedInput
      });
      
      await context.security.logSensitiveOperation(
        context.userId,
        'UPDATE_PRODUCT',
        'Product',
        updatedProduct.id,
        { product_name: updatedProduct.product_name, sku: updatedProduct.sku },
        context.redisClient
      );
      
      return updatedProduct;
    } catch (error) {
      logger.error('Failed to update product', error, 'GRAPHQL');
      throw new GraphQLError('Failed to update product');
    }
  },

  // Delete product
  async deleteProduct(parent: any, args: any, context: any) {
    const { id } = args;
    context.security.requireStaff(context);
    context.security.validateId(id);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    // Check if product exists
    const existingProduct = await context.prisma.product.findUnique({
      where: { id }
    });
    
    if (!existingProduct) {
      throw new GraphQLError('Product not found');
    }
    
    try {
      await context.prisma.product.delete({
        where: { id }
      });
      
      await context.security.logSensitiveOperation(
        context.userId,
        'DELETE_PRODUCT',
        'Product',
        id,
        { product_name: existingProduct.product_name, sku: existingProduct.sku },
        context.redisClient
      );
      
      return true;
    } catch (error) {
      logger.error('Failed to delete product', error, 'GRAPHQL');
      throw new GraphQLError('Failed to delete product');
    }
  },

  // Adjust stock
  async adjustStock(parent: any, args: any, context: any) {
    const { productId, quantity, note } = args;
    context.security.requireStaff(context);
    context.security.validateId(productId);
    
    // Log the incoming request
    logger.info('AdjustStock called', {
      productId,
      quantity,
      note,
      userId: context.userId,
      timestamp: new Date().toISOString()
    }, 'GRAPHQL');
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    // Check if product exists
    const product = await context.prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!product) {
      throw new GraphQLError('Product not found');
    }
    
    // Validate stock adjustment
    if (quantity < 0 && Math.abs(quantity) > product.stock_quantity) {
      throw new GraphQLError(`Insufficient stock. Available: ${product.stock_quantity}, Requested: ${Math.abs(quantity)}`);
    }
    
    try {
      // Use transaction to ensure data consistency
      const result = await context.prisma.$transaction(async (tx: any) => {
        // Update product stock
        const updatedProduct = await tx.product.update({
          where: { id: productId },
          data: {
            stock_quantity: {
              increment: quantity
            },
            updated_at: new Date()
          }
        });
        
        // Create stock record
        const stock = await tx.stock.create({
          data: {
            productId,
            quantity: Math.abs(quantity),
            quantity_in: quantity > 0 ? Math.abs(quantity) : 0,
            is_outofstock: updatedProduct.stock_quantity <= 0,
            note: note || 'Manual adjustment',
            createdByUserId: context.userId,
            created_by_username: context.user?.username || 'Unknown',
            created_at: new Date()
          }
        });
        
        return { updatedProduct, stock };
      });
      
      // Log the operation
      await context.security.logSensitiveOperation(
        context.userId,
        'ADJUST_STOCK',
        'Product',
        productId,
        { 
          product_name: product.product_name,
          old_quantity: product.stock_quantity,
          new_quantity: result.updatedProduct.stock_quantity,
          adjustment: quantity,
          note,
          stock_id: result.stock.id
        },
        context.redisClient
      );
      
      logger.info('Stock adjusted successfully', {
        productId,
        productName: product.product_name,
        oldQuantity: product.stock_quantity,
        newQuantity: result.updatedProduct.stock_quantity,
        adjustment: quantity,
        stockId: result.stock.id
      }, 'GRAPHQL');
      
      return result.stock;
    } catch (error) {
      logger.error('Failed to adjust stock', { 
        productId, 
        quantity, 
        note, 
        error: error instanceof Error ? error.message : error 
      }, 'GRAPHQL');
      throw new GraphQLError('Failed to adjust stock');
    }
  },

  // Create stock record
  async createStock(parent: any, args: any, context: any) {
    const { input } = args;
    context.security.requireStaff(context);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    // Validate required fields
    if (!input.productId || !input.quantity) {
      throw new GraphQLError('Product ID and quantity are required');
    }
    
    // Check if product exists
    const product = await context.prisma.product.findUnique({
      where: { id: input.productId }
    });
    
    if (!product) {
      throw new GraphQLError('Product not found');
    }
    
    try {
      // Use transaction to ensure data consistency
      const result = await context.prisma.$transaction(async (tx: any) => {
        // Update product stock
        const updatedProduct = await tx.product.update({
          where: { id: input.productId },
          data: {
            stock_quantity: {
              increment: input.quantity
            },
            updated_at: new Date()
          }
        });
        
        // Create stock record
        const stock = await tx.stock.create({
          data: {
            productId: input.productId,
            quantity: input.quantity,
            quantity_in: input.quantity_in || input.quantity,
            is_outofstock: input.is_outofstock || false,
            production_date: input.production_date,
            expiration_date: input.expiration_date,
            reference_table: input.reference_table,
            reference_id: input.reference_id,
            note: input.note || 'Stock entry',
            createdByUserId: context.userId,
            created_by_username: context.user?.username || 'Unknown',
            product_name: product.product_name,
            product_unit: product.unit,
            created_at: new Date()
          }
        });
        
        return { updatedProduct, stock };
      });
      
      // Log the operation
      await context.security.logSensitiveOperation(
        context.userId,
        'CREATE_STOCK',
        'Stock',
        result.stock.id,
        { 
          product_name: product.product_name,
          quantity: input.quantity,
          production_date: input.production_date,
          expiration_date: input.expiration_date
        },
        context.redisClient
      );
      
      return result.stock;
    } catch (error) {
      logger.error('Failed to create stock', { 
        input, 
        error: error instanceof Error ? error.message : error 
      }, 'GRAPHQL');
      throw new GraphQLError('Failed to create stock');
    }
  },

  // Update stock record
  async updateStock(parent: any, args: any, context: any) {
    const { id, input } = args;
    context.security.requireStaff(context);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    // Validate required fields
    if (!id) {
      throw new GraphQLError('Stock ID is required');
    }
    
    // Check if stock exists
    const existingStock = await context.prisma.stock.findUnique({
      where: { id },
      include: { product: true }
    });
    
    if (!existingStock) {
      throw new GraphQLError('Stock not found');
    }
    
    try {
      // Calculate quantity difference before transaction
      const quantityDifference = input.quantity !== undefined ? input.quantity - existingStock.quantity : 0;
      
      // Use transaction to ensure data consistency
      const result = await context.prisma.$transaction(async (tx: any) => {
        // Determine final quantity and out of stock status
        const finalQuantity = input.quantity !== undefined ? input.quantity : existingStock.quantity;
        const shouldBeOutOfStock = finalQuantity <= 0;
        
        // Update stock record
        const updatedStock = await tx.stock.update({
          where: { id },
          data: {
            quantity: finalQuantity,
            quantity_in: input.quantity_in !== undefined ? input.quantity_in : existingStock.quantity_in,
            is_outofstock: input.is_outofstock !== undefined ? input.is_outofstock : shouldBeOutOfStock,
            production_date: input.production_date !== undefined ? input.production_date : existingStock.production_date,
            expiration_date: input.expiration_date !== undefined ? input.expiration_date : existingStock.expiration_date,
            reference_table: input.reference_table !== undefined ? input.reference_table : existingStock.reference_table,
            reference_id: input.reference_id !== undefined ? input.reference_id : existingStock.reference_id,
            note: input.note !== undefined ? input.note : existingStock.note
          }
        });
        
        // Update product stock quantity if quantity changed
        if (quantityDifference !== 0) {
          await tx.product.update({
            where: { id: existingStock.productId },
            data: {
              stock_quantity: {
                increment: quantityDifference
              }
            }
          });
        }
        
        return { stock: updatedStock };
      });
      
      // Log audit trail
      await context.security.logSensitiveOperation(
        context.userId,
        'UPDATE_STOCK',
        'Stock',
        result.stock.id,
        { 
          product_name: existingStock.product.product_name,
          old_quantity: existingStock.quantity,
          new_quantity: input.quantity,
          quantity_difference: quantityDifference
        },
        context.redisClient
      );
      
      return result.stock;
    } catch (error) {
      logger.error('Failed to update stock', { 
        id, 
        input, 
        error: error instanceof Error ? error.message : error 
      }, 'GRAPHQL');
      throw new GraphQLError('Failed to update stock');
    }
  },

  async deleteStock(parent: any, args: any, context: any) {
    const { id } = args;
    context.security.requireStaff(context);

    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);

    if (!id) {
      throw new GraphQLError('Stock ID is required');
    }

    const existingStock = await context.prisma.stock.findUnique({
      where: { id },
      include: { product: true }
    });

    if (!existingStock) {
      throw new GraphQLError('Stock not found');
    }

    try {
      // Use transaction to ensure data consistency
      const result = await context.prisma.$transaction(async (tx: any) => {
        // Delete stock record
        const deletedStock = await tx.stock.delete({
          where: { id }
        });

        // Update product stock quantity by subtracting the deleted stock quantity
        await tx.product.update({
          where: { id: existingStock.productId },
          data: {
            stock_quantity: {
              decrement: existingStock.quantity
            }
          }
        });

        return { stock: deletedStock };
      });

      // Log audit trail
      await context.security.logSensitiveOperation(
        context.userId,
        'DELETE_STOCK',
        'Stock',
        result.stock.id,
        { 
          product_name: existingStock.product.product_name,
          deleted_quantity: existingStock.quantity,
          product_id: existingStock.productId
        },
        context.redisClient
      );

      return true;
    } catch (error) {
      logger.error('Failed to delete stock', { 
        id, 
        error: error instanceof Error ? error.message : error 
      }, 'GRAPHQL');
      throw new GraphQLError('Failed to delete stock');
    }
  }
};
