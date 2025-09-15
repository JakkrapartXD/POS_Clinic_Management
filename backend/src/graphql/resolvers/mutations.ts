import { GraphQLError } from "graphql";
import { hash } from "bcrypt";
import { logger } from "../../lib/logger";

export const mutations = {
  // User Mutations
  async createUser(parent: any, args: any, context: any) {
    const { input } = args;
    context.security.requireAdmin(context);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    // Validate input
    if (!context.security.validateEmail(input.email)) {
      throw new GraphQLError('Invalid email format');
    }
    
    // Sanitize input
    const sanitizedInput = {
      role: context.security.sanitizeString(input.role),
      email: context.security.sanitizeString(input.email).toLowerCase(),
      username: context.security.sanitizeString(input.username),
      status: input.status || 'active'
    };
    
    // Check for existing user
    const existingUser = await context.prisma.user.findFirst({
      where: {
        OR: [
          { email: sanitizedInput.email },
          { username: sanitizedInput.username }
        ]
      }
    });
    
    if (existingUser) {
      throw new GraphQLError('User with this email or username already exists');
    }
    
    // Hash password
    const password_hash = await hash(input.password, 12);
    
    const user = await context.prisma.user.create({
      data: {
        ...sanitizedInput,
        password_hash
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        created_at: true,
        updated_at: true
      }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'CREATE_USER',
      'User',
      user.id,
      { username: user.username, role: user.role },
      context.redisClient, context.redisClient
    );
    
    return user;
  },

  async updateUser(parent: any, args: any, context: any) {
    const { id, input } = args;
    context.security.requireAdmin(context);
    context.security.validateId(id);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    const updateData: any = {};
    
    if (input.role) updateData.role = context.security.sanitizeString(input.role);
    if (input.email) {
      if (!context.security.validateEmail(input.email)) {
        throw new GraphQLError('Invalid email format');
      }
      updateData.email = context.security.sanitizeString(input.email).toLowerCase();
    }
    if (input.username) updateData.username = context.security.sanitizeString(input.username);
    if (input.status) updateData.status = input.status;
    if (input.password) updateData.password_hash = await hash(input.password, 12);
    
    // Check for conflicts if email or username is being updated
    if (updateData.email || updateData.username) {
      const conflicts = await context.prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                updateData.email ? { email: updateData.email } : {},
                updateData.username ? { username: updateData.username } : {}
              ]
            }
          ]
        }
      });
      
      if (conflicts) {
        throw new GraphQLError('Email or username already in use');
      }
    }
    
    const user = await context.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        created_at: true,
        updated_at: true
      }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'UPDATE_USER',
      'User',
      id,
      updateData, context.redisClient
    );
    
    return user;
  },

  async deleteUser(parent: any, args: any, context: any) {
    const { id } = args;
    context.security.requireAdmin(context);
    context.security.validateId(id);
    
    await context.security.checkRateLimit(context.userId, 'sensitive', context.redisClient);
    
    // Prevent self-deletion
    if (id === context.userId) {
      throw new GraphQLError('Cannot delete your own account');
    }
    
    // Check if user exists and is not already deleted
    const user = await context.prisma.user.findFirst({
      where: { 
        id,
        isDelete: false
      }
    });
    
    if (!user) {
      throw new GraphQLError('User not found or already deleted');
    }
    
    // Soft delete: Update isDelete to true
    await context.prisma.user.update({
      where: { id },
      data: { 
        isDelete: true,
        updated_at: new Date()
      }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'SOFT_DELETE_USER',
      'User',
      id, context.redisClient
    );
    
    return true;
  },

  // Patient Mutations
  async createPatient(parent: any, args: any, context: any) {
    const { input } = args;
    context.security.requireStaff(context);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    // Validate and sanitize input
    const sanitizedInput = {
      first_name: context.security.sanitizeString(input.first_name),
      last_name: context.security.sanitizeString(input.last_name),
      date_of_birth: input.date_of_birth,
      gender: input.gender ? context.security.sanitizeString(input.gender) : null,
      phone: input.phone ? context.security.sanitizeString(input.phone) : null,
      email: input.email ? context.security.sanitizeString(input.email).toLowerCase() : null,
      address: input.address ? context.security.sanitizeString(input.address) : null
    };
    
    // Validate email and phone if provided
    if (sanitizedInput.email && !context.security.validateEmail(sanitizedInput.email)) {
      throw new GraphQLError('Invalid email format');
    }
    
    if (sanitizedInput.phone && !context.security.validatePhone(sanitizedInput.phone)) {
      throw new GraphQLError('Invalid phone number format');
    }
    
    const patient = await context.prisma.patient.create({
      data: sanitizedInput
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'CREATE_PATIENT',
      'Patient',
      patient.id,
      { name: `${patient.first_name} ${patient.last_name}` }, context.redisClient
    );
    
    return patient;
  },

  async updatePatient(parent: any, args: any, context: any) {
    const { id, input } = args;
    context.security.requireStaff(context);
    context.security.validateId(id);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    const updateData: any = {};
    
    if (input.first_name) updateData.first_name = context.security.sanitizeString(input.first_name);
    if (input.last_name) updateData.last_name = context.security.sanitizeString(input.last_name);
    if (input.date_of_birth) updateData.date_of_birth = input.date_of_birth;
    if (input.gender) updateData.gender = context.security.sanitizeString(input.gender);
    if (input.phone) {
      if (!context.security.validatePhone(input.phone)) {
        throw new GraphQLError('Invalid phone number format');
      }
      updateData.phone = context.security.sanitizeString(input.phone);
    }
    if (input.email) {
      if (!context.security.validateEmail(input.email)) {
        throw new GraphQLError('Invalid email format');
      }
      updateData.email = context.security.sanitizeString(input.email).toLowerCase();
    }
    if (input.address) updateData.address = context.security.sanitizeString(input.address);
    
    const patient = await context.prisma.patient.update({
      where: { id },
      data: updateData
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'UPDATE_PATIENT',
      'Patient',
      id,
      updateData, context.redisClient
    );
    
    return patient;
  },

  async deletePatient(parent: any, args: any, context: any) {
    const { id } = args;
    context.security.requireAdmin(context); // Only admins can delete patients
    context.security.validateId(id);
    
    await context.security.checkRateLimit(context.userId, 'sensitive', context.redisClient);
    
    // Check if patient exists and is not already deleted
    const patient = await context.prisma.patient.findFirst({
      where: { 
        id,
        isDelete: false
      }
    });
    
    if (!patient) {
      throw new GraphQLError('Patient not found or already deleted');
    }
    
    // Check for dependent records
    const dependencies = await context.prisma.patient.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            appointments: true,
            medicalRecords: true,
            orders: true,
            treatmentPlans: true
          }
        }
      }
    });
    
    const totalDependencies = (Object.values(dependencies?._count || {}) as number[]).reduce((sum, count) => sum + count, 0);
    
    if (totalDependencies > 0) {
      throw new GraphQLError('Cannot delete patient with existing medical records, appointments, or orders');
    }
    
    // Soft delete: Update isDelete to true
    await context.prisma.patient.update({
      where: { id },
      data: { 
        isDelete: true,
        updated_at: new Date()
      }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'SOFT_DELETE_PATIENT',
      'Patient',
      id, context.redisClient
    );
    
    return true;
  },

  // Product Mutations
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
      product_type: input.product_type ? context.security.sanitizeString(input.product_type) : null,
      generic_name: input.generic_name ? context.security.sanitizeString(input.generic_name) : null,
      short_name: input.short_name ? context.security.sanitizeString(input.short_name) : null
    };
    
    // Check for duplicate SKU or barcode if provided
    if (input.sku || input.barcode) {
      const existing = await context.prisma.product.findFirst({
        where: {
          OR: [
            input.sku ? { sku: input.sku } : {},
            input.barcode ? { barcode: input.barcode } : {}
          ]
        }
      });
      
      if (existing) {
        throw new GraphQLError('Product with this SKU or barcode already exists');
      }
    }
    
    const product = await context.prisma.product.create({
      data: sanitizedInput,
      include: {
        category: true
      }
    });
    
    // Create initial stock record
    if (input.stock_quantity > 0) {
      await context.prisma.stock.create({
        data: {
          productId: product.id,
          quantity: input.stock_quantity,
          quantity_in: input.stock_quantity,
          is_outofstock: false,
          note: 'Initial stock entry',
          createdByUserId: context.userId,
          created_by_username: context.user?.username,
          product_name: product.product_name,
          product_unit: product.unit
        }
      });
    }
    
    await context.security.logSensitiveOperation(
      context.userId,
      'CREATE_PRODUCT',
      'Product',
      product.id,
      { name: product.product_name }, context.redisClient
    );
    
    return product;
  },

  async updateProduct(parent: any, args: any, context: any) {
    const { id, input } = args;
    context.security.requireStaff(context);
    context.security.validateId(id);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    const updateData: any = {};
    
    // Sanitize string fields
    if (input.product_name) updateData.product_name = context.security.sanitizeString(input.product_name);
    if (input.product_type) updateData.product_type = context.security.sanitizeString(input.product_type);
    if (input.generic_name) updateData.generic_name = context.security.sanitizeString(input.generic_name);
    
    // Handle other fields
    Object.keys(input).forEach(key => {
      if (!['product_name', 'product_type', 'generic_name'].includes(key)) {
        updateData[key] = input[key];
      }
    });
    
    // Check for SKU/barcode conflicts if being updated
    if (input.sku || input.barcode) {
      const conflicts = await context.prisma.product.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                input.sku ? { sku: input.sku } : {},
                input.barcode ? { barcode: input.barcode } : {}
              ]
            }
          ]
        }
      });
      
      if (conflicts) {
        throw new GraphQLError('SKU or barcode already in use');
      }
    }
    
    const product = await context.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true
      }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'UPDATE_PRODUCT',
      'Product',
      id,
      updateData, context.redisClient
    );
    
    return product;
  },

  async deleteProduct(parent: any, args: any, context: any) {
    const { id } = args;
    context.security.requireStaff(context);
    context.security.validateId(id);
    
    await context.security.checkRateLimit(context.userId, 'sensitive', context.redisClient);
    
    // Check if product exists and is not already deleted
    const product = await context.prisma.product.findFirst({
      where: { 
        id,
        isDelete: false
      }
    });
    
    if (!product) {
      throw new GraphQLError('Product not found or already deleted');
    }
    
    
    // Soft delete: Update isDelete to true
    await context.prisma.product.update({
      where: { id },
      data: { 
        isDelete: true,
        updated_at: new Date()
      }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'SOFT_DELETE_PRODUCT',
      'Product',
      id, context.redisClient
    );
    
    return true;
  },

  async adjustStock(parent: any, args: any, context: any) {
    const { productId, quantity, note } = args;
    context.security.requireStaff(context);
    context.security.validateId(productId);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    if (quantity === 0) {
      throw new GraphQLError('Quantity adjustment cannot be zero');
    }
    
    const product = await context.prisma.product.findUnique({
      where: { id: productId },
      select: { stock_quantity: true, product_name: true }
    });
    
    if (!product) {
      throw new GraphQLError('Product not found');
    }
    
    const newStockQuantity = product.stock_quantity + quantity;
    
    if (newStockQuantity < 0) {
      throw new GraphQLError('Stock adjustment would result in negative stock');
    }
    
    // Update product stock
    await context.prisma.product.update({
      where: { id: productId },
      data: { stock_quantity: newStockQuantity }
    });
    
    // Create stock record
    const stock = await context.prisma.stock.create({
      data: {
        productId,
        quantity: Math.abs(quantity),
        quantity_in: quantity > 0 ? Math.abs(quantity) : 0,
        is_outofstock: newStockQuantity <= 0,
        note: note || (quantity > 0 ? 'Stock increase' : 'Stock decrease'),
        createdByUserId: context.userId,
        created_by_username: context.user?.username,
        product_name: product.product_name,
        product_unit: product.unit
      },
      include: {
        product: {
          select: {
            product_name: true,
            unit: true
          }
        }
      }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'ADJUST_STOCK',
      'Product',
      productId,
      { quantity, newStock: newStockQuantity }, context.redisClient
    );
    
    return stock;
  },

  // Bulk Import Products
  async bulkImportProducts(parent: any, args: any, context: any) {
    const { input } = args;
    const { products, settings = {} } = input;
    
    // Check permissions - require admin or staff
    context.security.requireAdmin(context);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    logger.info('Starting bulk product import', { 
      productCount: products.length, 
      userId: context.userId,
      settings 
    }, 'IMPORT');

    const results = [];
    let imported = 0;
    let failed = 0;
    let skipped = 0;
    const errors = [];

    // Create backup if requested
    if (settings.createBackup) {
      try {
        logger.info('Creating backup before import', {}, 'IMPORT');
        // You could implement backup logic here
      } catch (error) {
        logger.error('Failed to create backup', error, 'IMPORT');
        errors.push('ไม่สามารถสร้างข้อมูลสำรองได้');
      }
    }

    // Process each product
    for (const productInput of products) {
      try {
        // Validate required fields
        if (!productInput.product_name || !productInput.sale_price) {
          failed++;
          results.push({
            product: null,
            status: 'FAILED',
            error: 'ข้อมูลไม่ครบถ้วน: ต้องมีชื่อสินค้าและราคาขาย',
            sku: productInput.sku,
            product_name: productInput.product_name || 'ไม่ระบุ'
          });
          continue;
        }

        // Validate categoryId if provided
        if (productInput.categoryId) {
          const categoryExists = await context.prisma.category.findUnique({
            where: { id: productInput.categoryId }
          });
          if (!categoryExists) {
            failed++;
            results.push({
              product: null,
              status: 'FAILED',
              error: `หมวดหมู่ไม่พบ: ${productInput.categoryId}`,
              sku: productInput.sku,
              product_name: productInput.product_name
            });
            continue;
          }
        }

        // Sanitize input
        const sanitizedInput = {
          product_name: context.security.sanitizeString(productInput.product_name),
          product_type: productInput.product_type ? context.security.sanitizeString(productInput.product_type) : null,
          generic_name: productInput.generic_name ? context.security.sanitizeString(productInput.generic_name) : null,
          short_name: productInput.short_name ? context.security.sanitizeString(productInput.short_name) : null,
          status: productInput.status || 'active',
          vat_percent: productInput.vat_percent || 0,
          expiration_warning_date: productInput.expiration_warning_date,
          sale_price: productInput.sale_price,
          unit: productInput.unit ? context.security.sanitizeString(productInput.unit) : null,
          pack_size: productInput.pack_size ? context.security.sanitizeString(productInput.pack_size) : null,
          reorder_point: productInput.reorder_point || 0,
          cost: productInput.cost || 0,
          sku: productInput.sku ? context.security.sanitizeString(productInput.sku) : null,
          barcode: productInput.barcode ? context.security.sanitizeString(productInput.barcode) : null,
          stock_quantity: productInput.stock_quantity || 0,
          volume: productInput.volume,
          volume_unit: productInput.volume_unit ? context.security.sanitizeString(productInput.volume_unit) : null,
          shelf_code: productInput.shelf_code ? context.security.sanitizeString(productInput.shelf_code) : null,
          shelf_row: productInput.shelf_row ? context.security.sanitizeString(productInput.shelf_row) : null,
          categoryId: productInput.categoryId ? productInput.categoryId : null,
          symptom_category: productInput.symptom_category ? context.security.sanitizeString(productInput.symptom_category) : null,
          license_number: productInput.license_number ? context.security.sanitizeString(productInput.license_number) : null,
          dosage_unit: productInput.dosage_unit ? context.security.sanitizeString(productInput.dosage_unit) : null,
          dosage: productInput.dosage ? context.security.sanitizeString(productInput.dosage) : null,
          times_per_day: productInput.times_per_day,
          interval_hours: productInput.interval_hours,
          before_meal: productInput.before_meal,
          after_meal: productInput.after_meal,
          after_meal_immediate: productInput.after_meal_immediate,
          morning: productInput.morning,
          noon: productInput.noon,
          evening: productInput.evening,
          before_bed: productInput.before_bed,
          properties: productInput.properties ? context.security.sanitizeString(productInput.properties) : null,
          usage_instruction: productInput.usage_instruction ? context.security.sanitizeString(productInput.usage_instruction) : null,
          sale_note: productInput.sale_note ? context.security.sanitizeString(productInput.sale_note) : null,
          purchase_note: productInput.purchase_note ? context.security.sanitizeString(productInput.purchase_note) : null
        };

        // Check for duplicates
        const existingProduct = await context.prisma.product.findFirst({
          where: {
            OR: [
              { sku: sanitizedInput.sku },
              { product_name: sanitizedInput.product_name },
              { barcode: sanitizedInput.barcode }
            ].filter(condition => Object.values(condition)[0] != null)
          }
        });

        if (existingProduct) {
          if (settings.skipDuplicates) {
            skipped++;
            results.push({
              product: existingProduct,
              status: 'SKIPPED',
              error: 'สินค้านี้มีอยู่แล้วในระบบ',
              sku: sanitizedInput.sku,
              product_name: sanitizedInput.product_name
            });
            continue;
          } else if (settings.updateExisting) {
            // Update existing product
            const updatedProduct = await context.prisma.product.update({
              where: { id: existingProduct.id },
              data: sanitizedInput
            });
            
            imported++;
            results.push({
              product: updatedProduct,
              status: 'UPDATED',
              error: null,
              sku: sanitizedInput.sku,
              product_name: sanitizedInput.product_name
            });

            await context.security.logSensitiveOperation(
              context.userId,
              'UPDATE_PRODUCT_BULK',
              'Product',
              updatedProduct.id,
              { product_name: updatedProduct.product_name },
              context.redisClient
            );
            continue;
          } else {
            failed++;
            results.push({
              product: null,
              status: 'FAILED',
              error: 'สินค้านี้มีอยู่แล้วในระบบ',
              sku: sanitizedInput.sku,
              product_name: sanitizedInput.product_name
            });
            continue;
          }
        }

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
                production_date: productInput.production_date || null,
                expiration_date: productInput.expiration_date || null,
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
          error: null,
          sku: sanitizedInput.sku,
          product_name: sanitizedInput.product_name
        });

        await context.security.logSensitiveOperation(
          context.userId,
          'CREATE_PRODUCT_BULK',
          'Product',
          result.id,
          { product_name: result.product_name },
          context.redisClient
        );

      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ';
        
        results.push({
          product: null,
          status: 'FAILED',
          error: errorMessage,
          sku: productInput.sku,
          product_name: productInput.product_name || 'ไม่ระบุ'
        });

        logger.error('Failed to import product', { 
          error: errorMessage, 
          productInput 
        }, 'IMPORT');
        
        errors.push(`${productInput.product_name || 'ไม่ระบุ'}: ${errorMessage}`);
      }
    }

    // Log summary
    logger.info('Bulk import completed', {
      totalProducts: products.length,
      imported,
      failed,
      skipped,
      userId: context.userId
    }, 'IMPORT');

    return {
      success: failed === 0,
      message: `นำเข้าสำเร็จ ${imported} รายการ, ล้มเหลว ${failed} รายการ, ข้าม ${skipped} รายการ`,
      imported,
      failed,
      skipped,
      errors,
      results
    };
  },

  // Category Mutations
  async createCategory(parent: any, args: any, context: any) {
    const { input } = args;
    context.security.requireAdmin(context);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    const sanitizedInput = {
      name: context.security.sanitizeString(input.name),
      description: input.description ? context.security.sanitizeString(input.description) : null,
      code: input.code ? context.security.sanitizeString(input.code) : null
    };
    
    try {
      const category = await context.prisma.category.create({
        data: sanitizedInput
      });
      
      await context.security.logSensitiveOperation(
        context.userId,
        'CREATE_CATEGORY',
        'Category',
        category.id,
        { name: category.name }, context.redisClient
      );
      
      return category;
    } catch (error: any) {
      if (error.code === 'P2002') {
        if (error.meta?.target?.includes('name')) {
          throw new GraphQLError('Category name already exists');
        }
        if (error.meta?.target?.includes('code')) {
          throw new GraphQLError('Category code already exists');
        }
      }
      throw new GraphQLError('Failed to create category');
    }
  },

  async updateCategory(parent: any, args: any, context: any) {
    const { id, input } = args;
    context.security.requireAdmin(context);
    context.security.validateId(id);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    const updateData: any = {};
    
    if (input.name) updateData.name = context.security.sanitizeString(input.name);
    if (input.description !== undefined) {
      updateData.description = input.description ? context.security.sanitizeString(input.description) : null;
    }
    if (input.code !== undefined) {
      updateData.code = input.code ? context.security.sanitizeString(input.code) : null;
    }
    
    try {
      const category = await context.prisma.category.update({
        where: { id },
        data: updateData
      });
      
      await context.security.logSensitiveOperation(
        context.userId,
        'UPDATE_CATEGORY',
        'Category',
        category.id,
        { name: category.name }, context.redisClient
      );
      
      return category;
    } catch (error: any) {
      if (error.code === 'P2002') {
        if (error.meta?.target?.includes('name')) {
          throw new GraphQLError('Category name already exists');
        }
        if (error.meta?.target?.includes('code')) {
          throw new GraphQLError('Category code already exists');
        }
      }
      if (error.code === 'P2025') {
        throw new GraphQLError('Category not found');
      }
      throw new GraphQLError('Failed to update category');
    }
  },

  async deleteCategory(parent: any, args: any, context: any) {
    const { id } = args;
    context.security.requireAdmin(context);
    context.security.validateId(id);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    // Check if category exists and is not already deleted
    const category = await context.prisma.category.findFirst({
      where: { 
        id,
        isDelete: false
      }
    });
    
    if (!category) {
      throw new GraphQLError('Category not found or already deleted');
    }
    
    // Check if category has active products
    const productsCount = await context.prisma.product.count({
      where: { 
        categoryId: id,
        isDelete: false
      }
    });
    
    if (productsCount > 0) {
      throw new GraphQLError(`Cannot delete category. It has ${productsCount} active products associated with it.`);
    }
    
    try {
      // Soft delete: Update isDelete to true
      await context.prisma.category.update({
        where: { id },
        data: { 
          isDelete: true,
          updated_at: new Date()
        }
      });
      
      await context.security.logSensitiveOperation(
        context.userId,
        'SOFT_DELETE_CATEGORY',
        'Category',
        id,
        { name: category.name }, context.redisClient
      );
      
      return true;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new GraphQLError('Category not found');
      }
      throw new GraphQLError('Failed to delete category');
    }
  },

  // Supplier Mutations
  async updateSupplier(parent: any, args: any, context: any) {
    const { id, input } = args;
    context.security.requireAdmin(context);
    context.security.validateId(id);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    const updateData: any = {};
    
    // Sanitize string fields
    if (input.name) updateData.name = context.security.sanitizeString(input.name);
    if (input.contact_name) updateData.contact_name = context.security.sanitizeString(input.contact_name);
    if (input.phone) updateData.phone = context.security.sanitizeString(input.phone);
    if (input.email) updateData.email = context.security.sanitizeString(input.email);
    if (input.address) updateData.address = context.security.sanitizeString(input.address);
    
    const supplier = await context.prisma.supplier.update({
      where: { id },
      data: updateData,
      include: {
        purchases: {
          orderBy: { purchase_date: 'desc' },
          take: 3
        }
      }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'UPDATE_SUPPLIER',
      'Supplier',
      id,
      updateData, context.redisClient
    );
    
    return supplier;
  },

  async deleteSupplier(parent: any, args: any, context: any) {
    const { id } = args;
    context.security.requireAdmin(context);
    context.security.validateId(id);
    
    await context.security.checkRateLimit(context.userId, 'sensitive', context.redisClient);
    
    // Check if supplier exists and is not already deleted
    const supplier = await context.prisma.supplier.findFirst({
      where: { 
        id,
        isDelete: false
      }
    });
    
    if (!supplier) {
      throw new GraphQLError('Supplier not found or already deleted');
    }
    
    // Check for dependent records
    const dependencies = await context.prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            purchases: true
          }
        }
      }
    });
    
    const totalDependencies = (Object.values(dependencies?._count || {}) as number[]).reduce((sum, count) => sum + count, 0);
    
    if (totalDependencies > 0) {
      throw new GraphQLError('Cannot delete supplier with existing purchases');
    }
    
    // Soft delete: Update isDelete to true
    await context.prisma.supplier.update({
      where: { id },
      data: { 
        isDelete: true,
        updated_at: new Date()
      }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'SOFT_DELETE_SUPPLIER',
      'Supplier',
      id, context.redisClient
    );
    
    return true;
  },

  // Purchase Mutations
  async updatePurchase(parent: any, args: any, context: any) {
    const { id, input } = args;
    context.security.requireStaff(context);
    context.security.validateId(id);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    const updateData: any = {};
    
    // Sanitize string fields
    if (input.supplierId) updateData.supplierId = input.supplierId;
    if (input.total_amount !== undefined) updateData.total_amount = input.total_amount;
    if (input.status) updateData.status = input.status;
    
    const purchase = await context.prisma.purchase.update({
      where: { id },
      data: updateData,
      include: {
        supplier: true,
        user: {
          select: { id: true, username: true }
        },
        purchaseItems: {
          include: {
            product: {
              select: { product_name: true, unit: true }
            }
          }
        }
      }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'UPDATE_PURCHASE',
      'Purchase',
      id,
      updateData, context.redisClient
    );
    
    return purchase;
  },

  async deletePurchase(parent: any, args: any, context: any) {
    const { id } = args;
    context.security.requireStaff(context);
    context.security.validateId(id);
    
    await context.security.checkRateLimit(context.userId, 'sensitive', context.redisClient);
    
    // Check if purchase exists and is not already deleted
    const purchase = await context.prisma.purchase.findFirst({
      where: { 
        id,
        isDelete: false
      }
    });
    
    if (!purchase) {
      throw new GraphQLError('Purchase not found or already deleted');
    }
    
    // Check for dependent records
    const dependencies = await context.prisma.purchase.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            purchaseItems: true
          }
        }
      }
    });
    
    const totalDependencies = (Object.values(dependencies?._count || {}) as number[]).reduce((sum, count) => sum + count, 0);
    
    if (totalDependencies > 0) {
      throw new GraphQLError('Cannot delete purchase with existing purchase items');
    }
    
    // Soft delete: Update isDelete to true
    await context.prisma.purchase.update({
      where: { id },
      data: { 
        isDelete: true,
        updated_at: new Date()
      }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'SOFT_DELETE_PURCHASE',
      'Purchase',
      id, context.redisClient
    );
    
    return true;
  },

  // Appointment Mutations
  async updateAppointment(parent: any, args: any, context: any) {
    const { id, input } = args;
    context.security.requireStaff(context);
    context.security.validateId(id);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    const updateData: any = {};
    
    if (input.appointment_time) updateData.appointment_time = input.appointment_time;
    if (input.status) updateData.status = input.status;
    if (input.reason) updateData.reason = input.reason;
    
    const appointment = await context.prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: true,
        doctor: {
          select: { id: true, username: true }
        },
        medicalRecords: {
          orderBy: { created_at: 'desc' },
          take: 5
        }
      }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'UPDATE_APPOINTMENT',
      'Appointment',
      id,
      updateData, context.redisClient
    );
    
    return appointment;
  },

  async deleteAppointment(parent: any, args: any, context: any) {
    const { id } = args;
    context.security.requireStaff(context);
    context.security.validateId(id);
    
    await context.security.checkRateLimit(context.userId, 'sensitive', context.redisClient);
    
    // Check if appointment exists and is not already deleted
    const appointment = await context.prisma.appointment.findFirst({
      where: { 
        id,
        isDelete: false
      }
    });
    
    if (!appointment) {
      throw new GraphQLError('Appointment not found or already deleted');
    }
    
    // Check for dependent records
    const dependencies = await context.prisma.appointment.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            medicalRecords: true
          }
        }
      }
    });
    
    const totalDependencies = (Object.values(dependencies?._count || {}) as number[]).reduce((sum, count) => sum + count, 0);
    
    if (totalDependencies > 0) {
      throw new GraphQLError('Cannot delete appointment with existing medical records');
    }
    
    // Soft delete: Update isDelete to true
    await context.prisma.appointment.update({
      where: { id },
      data: { 
        isDelete: true,
        updated_at: new Date()
      }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'SOFT_DELETE_APPOINTMENT',
      'Appointment',
      id, context.redisClient
    );
    
    return true;
  },

  // MedicalRecord Mutations
  async updateMedicalRecord(parent: any, args: any, context: any) {
    const { id, input } = args;
    context.security.requireStaff(context);
    context.security.validateId(id);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    const updateData: any = {};
    
    if (input.symptoms) updateData.symptoms = input.symptoms;
    if (input.diagnosis) updateData.diagnosis = input.diagnosis;
    if (input.treatment) updateData.treatment = input.treatment;
    if (input.notes) updateData.notes = input.notes;
    
    const medicalRecord = await context.prisma.medicalRecord.update({
      where: { id },
      data: updateData,
      include: {
        patient: true,
        doctor: {
          select: { id: true, username: true }
        },
        appointment: true,
        prescriptions: {
          include: {
            product: {
              select: { product_name: true, unit: true }
            }
          }
        }
      }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'UPDATE_MEDICAL_RECORD',
      'MedicalRecord',
      id,
      updateData, context.redisClient
    );
    
    return medicalRecord;
  },

  async deleteMedicalRecord(parent: any, args: any, context: any) {
    const { id } = args;
    context.security.requireStaff(context);
    context.security.validateId(id);
    
    await context.security.checkRateLimit(context.userId, 'sensitive', context.redisClient);
    
    // Check if medical record exists and is not already deleted
    const medicalRecord = await context.prisma.medicalRecord.findFirst({
      where: { 
        id,
        isDelete: false
      }
    });
    
    if (!medicalRecord) {
      throw new GraphQLError('Medical record not found or already deleted');
    }
    
    // Check for dependent records
    const dependencies = await context.prisma.medicalRecord.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            prescriptions: true
          }
        }
      }
    });
    
    const totalDependencies = (Object.values(dependencies?._count || {}) as number[]).reduce((sum, count) => sum + count, 0);
    
    if (totalDependencies > 0) {
      throw new GraphQLError('Cannot delete medical record with existing prescriptions');
    }
    
    // Soft delete: Update isDelete to true
    await context.prisma.medicalRecord.update({
      where: { id },
      data: { 
        isDelete: true,
        updated_at: new Date()
      }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'SOFT_DELETE_MEDICAL_RECORD',
      'MedicalRecord',
      id, context.redisClient
    );
    
    return true;
  },

  // TreatmentPlan Mutations
  async updateTreatmentPlan(parent: any, args: any, context: any) {
    const { id, input } = args;
    context.security.requireStaff(context);
    context.security.validateId(id);
    
    await context.security.checkRateLimit(context.userId, 'mutation', context.redisClient);
    
    const updateData: any = {};
    
    if (input.plan_details) updateData.plan_details = input.plan_details;
    if (input.start_date) updateData.start_date = input.start_date;
    if (input.end_date) updateData.end_date = input.end_date;
    
    const treatmentPlan = await context.prisma.treatmentPlan.update({
      where: { id },
      data: updateData,
      include: {
        patient: true,
        doctor: {
          select: { id: true, username: true }
        }
      }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'UPDATE_TREATMENT_PLAN',
      'TreatmentPlan',
      id,
      updateData, context.redisClient
    );
    
    return treatmentPlan;
  },

  async deleteTreatmentPlan(parent: any, args: any, context: any) {
    const { id } = args;
    context.security.requireStaff(context);
    context.security.validateId(id);
    
    await context.security.checkRateLimit(context.userId, 'sensitive', context.redisClient);
    
    // Check if treatment plan exists and is not already deleted
    const treatmentPlan = await context.prisma.treatmentPlan.findFirst({
      where: { 
        id,
        isDelete: false
      }
    });
    
    if (!treatmentPlan) {
      throw new GraphQLError('Treatment plan not found or already deleted');
    }
    
    // Soft delete: Update isDelete to true
    await context.prisma.treatmentPlan.update({
      where: { id },
      data: { 
        isDelete: true,
        updated_at: new Date()
      }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'SOFT_DELETE_TREATMENT_PLAN',
      'TreatmentPlan',
      id, context.redisClient
    );
    
    return true;
  },

  // Image upload mutations
  async updateUserAvatar(parent: any, args: any, context: any) {
    const { id, avatar_url } = args;
    
    context.security.requireAuth(context);
    context.security.validateId(id);
    
    // Check if user exists and is not deleted
    const existingUser = await context.prisma.user.findFirst({
      where: { 
        id,
        isDelete: false
      }
    });
    
    if (!existingUser) {
      throw new GraphQLError('User not found or already deleted');
    }

    // Only allow users to update their own avatar or admin to update any
    if (context.userId !== id && context.userRole !== 'admin') {
      throw new GraphQLError('Unauthorized to update this user avatar');
    }
    
    const user = await context.prisma.user.update({
      where: { id },
      data: { 
        avatar_url,
        avatar_path: avatar_url, // Store same as URL for now
        updated_at: new Date()
      }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'UPDATE_USER_AVATAR',
      'User',
      id, context.redisClient
    );
    
    return user;
  },

  async updatePatientPhoto(parent: any, args: any, context: any) {
    const { id, photo_url } = args;
    
    context.security.requireAuth(context);
    context.security.validateId(id);
    
    // Check if patient exists and is not deleted
    const existingPatient = await context.prisma.patient.findFirst({
      where: { 
        id,
        isDelete: false
      }
    });
    
    if (!existingPatient) {
      throw new GraphQLError('Patient not found or already deleted');
    }
    
    const patient = await context.prisma.patient.update({
      where: { id },
      data: { 
        photo_url,
        photo_path: photo_url, // Store same as URL for now
        updated_at: new Date()
      }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'UPDATE_PATIENT_PHOTO',
      'Patient',
      id, context.redisClient
    );
    
    return patient;
  },

  async updateProductImage(parent: any, args: any, context: any) {
    const { id, image_url } = args;
    
    context.security.requireAuth(context);
    context.security.validateId(id);
    
    // Check if product exists and is not deleted
    const existingProduct = await context.prisma.product.findFirst({
      where: { 
        id,
        isDelete: false
      }
    });
    
    if (!existingProduct) {
      throw new GraphQLError('Product not found or already deleted');
    }
    
    const product = await context.prisma.product.update({
      where: { id },
      data: { 
        image_url,
        image_path: image_url, // Store same as URL for now
        updated_at: new Date()
      },
      include: {
        category: true
      }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'UPDATE_PRODUCT_IMAGE',
      'Product',
      id, context.redisClient
    );
    
    return product;
  }
}; 