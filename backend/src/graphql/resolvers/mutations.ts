import { GraphQLError } from "graphql";
import { hash } from "bcrypt";

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
    
    // Check for dependent records
    const dependencies = await context.prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            appointments: true,
            medicalRecords: true,
            orders: true,
            purchases: true
          }
        }
      }
    });
    
    if (!dependencies) {
      throw new GraphQLError('User not found');
    }
    
    const totalDependencies = (Object.values(dependencies._count) as number[]).reduce((sum, count) => sum + count, 0);
    
    if (totalDependencies > 0) {
      throw new GraphQLError('Cannot delete user with existing records. Set status to inactive instead.');
    }
    
    await context.prisma.user.delete({
      where: { id }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'DELETE_USER',
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
    
    if (!dependencies) {
      throw new GraphQLError('Patient not found');
    }
    
    const totalDependencies = (Object.values(dependencies._count) as number[]).reduce((sum, count) => sum + count, 0);
    
    if (totalDependencies > 0) {
      throw new GraphQLError('Cannot delete patient with existing medical records, appointments, or orders');
    }
    
    await context.prisma.patient.delete({
      where: { id }
    });
    
    await context.security.logSensitiveOperation(
      context.userId,
      'DELETE_PATIENT',
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
      data: sanitizedInput
    });
    
    // Create initial stock movement
    await context.prisma.stockMovement.create({
      data: {
        productId: product.id,
        movement_type: 'in',
        quantity: input.stock_quantity || 0,
        note: 'Initial stock entry',
        createdByUserId: context.userId,
        created_by_username: context.user?.username
      }
    });
    
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
      data: updateData
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
    
    // Create stock movement record
    const stockMovement = await context.prisma.stockMovement.create({
      data: {
        productId,
        movement_type: quantity > 0 ? 'in' : 'out',
        quantity: Math.abs(quantity),
        note: note || (quantity > 0 ? 'Stock increase' : 'Stock decrease'),
        createdByUserId: context.userId,
        created_by_username: context.user?.username
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
    
    return stockMovement;
  }
}; 