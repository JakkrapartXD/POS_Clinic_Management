import { GraphQLError } from "graphql";
import { SecurityService } from "../security";
import { hash } from "bcrypt";

export const queries = {
  // User Queries
  async users(parent: any, args: any, context: any) {
    const { filter, pagination } = args;
    context.security.requireAdmin(context);
    
    await context.security.checkRateLimit(context.userId, 'query', context.redisClient);
    context.security.validatePagination(pagination);
    
    const where: any = {};
    
    if (filter) {
      if (filter.role) where.role = filter.role;
      if (filter.status) where.status = filter.status;
      if (filter.email) where.email = { contains: filter.email, mode: 'insensitive' };
      if (filter.username) where.username = { contains: filter.username, mode: 'insensitive' };
    }
    
    const [users, total] = await Promise.all([
      context.prisma.user.findMany({
        where,
        skip: pagination?.skip || 0,
        take: pagination?.take || 10,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          created_at: true,
          updated_at: true
        }
      }),
      context.prisma.user.count({ where })
    ]);
    
    return { users, total };
  },

  async user(parent: any, args: any, context: any) {
    const { id } = args;
    context.security.requireStaff(context);
    context.security.validateId(id);
    
    const user = await context.prisma.user.findUnique({
      where: { id },
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
    
    if (!user) {
      throw new GraphQLError('User not found');
    }
    
    return user;
  },

  async me(parent: any, args: any, context: any) {
    context.security.requireAuth(context);
    
    const user = await context.prisma.user.findUnique({
      where: { id: context.userId },
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
    
    return user;
  },

  // Patient Queries
  async patients(parent: any, args: any, context: any) {
    const { pagination } = args;
    context.security.requireStaff(context);
    
    await context.security.checkRateLimit(context.userId, 'query', context.redisClient);
    context.security.validatePagination(pagination);
    
    const [patients, total] = await Promise.all([
      context.prisma.patient.findMany({
        skip: pagination?.skip || 0,
        take: pagination?.take || 10,
        orderBy: { created_at: 'desc' }
      }),
      context.prisma.patient.count()
    ]);
    
    return { patients, total };
  },

  async patient(parent: any, args: any, context: any) {
    const { id } = args;
    context.security.requireStaff(context);
    context.security.validateId(id);
    
    await context.security.validatePatientAccess(context.userId, id, context.role);
    
    const patient = await context.prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: {
          orderBy: { appointment_time: 'desc' },
          take: 5
        },
        orders: {
          orderBy: { order_date: 'desc' },
          take: 5
        }
      }
    });
    
    if (!patient) {
      throw new GraphQLError('Patient not found');
    }
    
    return patient;
  },

  async searchPatients(parent: any, args: any, context: any) {
    const { query } = args;
    context.security.requireStaff(context);
    
    if (!query || query.length < 2) {
      throw new GraphQLError('Search query must be at least 2 characters');
    }
    
    const sanitizedQuery = context.security.sanitizeString(query);
    
    const patients = await context.prisma.patient.findMany({
      where: {
        OR: [
          { first_name: { contains: sanitizedQuery, mode: 'insensitive' } },
          { last_name: { contains: sanitizedQuery, mode: 'insensitive' } },
          { phone: { contains: sanitizedQuery } },
          { email: { contains: sanitizedQuery, mode: 'insensitive' } }
        ]
      },
      take: 20,
      orderBy: { created_at: 'desc' }
    });
    
    return patients;
  },

  // Product Queries
  async products(parent: any, args: any, context: any) {
    const { filter, pagination } = args;
    context.security.requireStaff(context);
    
    await context.security.checkRateLimit(context.userId, 'query', context.redisClient);
    context.security.validatePagination(pagination);
    
    const where: any = {};
    
    if (filter) {
      if (filter.product_type) where.product_type = filter.product_type;
      if (filter.category) where.categoryId = filter.category;
      if (filter.status) where.status = filter.status;
      if (filter.low_stock) {
        where.stock_quantity = { lte: context.prisma.$raw('reorder_point') };
      }
    }
    
    const [products, total] = await Promise.all([
      context.prisma.product.findMany({
        where,
        skip: pagination?.skip || 0,
        take: pagination?.take || 10,
        orderBy: { created_at: 'desc' },
        include: {
          category: true
        }
      }),
      context.prisma.product.count({ where })
    ]);
    
    return { products, total };
  },

  async product(parent: any, args: any, context: any) {
    const { id } = args;
    context.security.requireStaff(context);
    context.security.validateId(id);
    
    const product = await context.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        stockMovements: {
          orderBy: { created_at: 'desc' },
          take: 10
        },
        stockAlerts: {
          where: { acknowledged: false },
          orderBy: { created_at: 'desc' }
        }
      }
    });
    
    if (!product) {
      throw new GraphQLError('Product not found');
    }
    
    return product;
  },

  async searchProducts(parent: any, args: any, context: any) {
    const { query } = args;
    context.security.requireStaff(context);
    
    if (!query || query.length < 2) {
      throw new GraphQLError('Search query must be at least 2 characters');
    }
    
    const sanitizedQuery = context.security.sanitizeString(query);
    
    const products = await context.prisma.product.findMany({
      where: {
        OR: [
          { product_name: { contains: sanitizedQuery, mode: 'insensitive' } },
          { generic_name: { contains: sanitizedQuery, mode: 'insensitive' } },
          { sku: { contains: sanitizedQuery } },
          { barcode: { contains: sanitizedQuery } }
        ],
        status: 'active'
      },
      take: 20,
      orderBy: { product_name: 'asc' }
    });
    
    return products;
  },

  async lowStockProducts(parent: any, args: any, context: any) {
    context.security.requireStaff(context);
    
    const products = await context.prisma.product.findMany({
      where: {
        AND: [
          { status: 'active' },
          {
            OR: [
              { stock_quantity: { lte: context.prisma.$raw('reorder_point') } },
              { stock_quantity: { lte: 10 } } // Fallback for products without reorder_point
            ]
          }
        ]
      },
      orderBy: { stock_quantity: 'asc' },
      take: 50
    });
    
    return products;
  },

  async checkSkuExists(parent: any, args: any, context: any) {
    const { sku } = args;
    context.security.requireStaff(context);
    
    await context.security.checkRateLimit(context.userId, 'query', context.redisClient);
    
    if (!sku || sku.trim().length === 0) {
      return false;
    }
    
    const existingProduct = await context.prisma.product.findFirst({
      where: { sku: sku.trim() }
    });
    
    return !!existingProduct;
  },

  // Order Queries
  async orders(parent: any, args: any, context: any) {
    const { filter, pagination } = args;
    context.security.requireStaff(context);
    
    await context.security.checkRateLimit(context.userId, 'query', context.redisClient);
    context.security.validatePagination(pagination);
    
    const where: any = {};
    
    if (filter) {
      if (filter.status) where.status = filter.status;
      if (filter.is_walkin !== undefined) where.is_walkin = filter.is_walkin;
      if (filter.date_from || filter.date_to) {
        where.order_date = {};
        if (filter.date_from) where.order_date.gte = filter.date_from;
        if (filter.date_to) where.order_date.lte = filter.date_to;
      }
    }
    
    const [orders, total] = await Promise.all([
      context.prisma.order.findMany({
        where,
        skip: pagination?.skip || 0,
        take: pagination?.take || 10,
        include: {
          patient: true,
          user: {
            select: { id: true, username: true }
          },
          orderItems: {
            include: {
              product: {
                select: { product_name: true, unit: true }
              }
            }
          },
          payments: true
        },
        orderBy: { order_date: 'desc' }
      }),
      context.prisma.order.count({ where })
    ]);
    
    return { orders, total };
  },

  async order(parent: any, args: any, context: any) {
    const { id } = args;
    context.security.requireStaff(context);
    context.security.validateId(id);
    
    const order = await context.prisma.order.findUnique({
      where: { id },
      include: {
        patient: true,
        user: {
          select: { id: true, username: true }
        },
        orderItems: {
          include: {
            product: true
          }
        },
        payments: true,
        invoice: true
      }
    });
    
    if (!order) {
      throw new GraphQLError('Order not found');
    }
    
    return order;
  },

  async patientOrders(parent: any, args: any, context: any) {
    const { patientId } = args;
    context.security.requireStaff(context);
    context.security.validateId(patientId);
    
    await context.security.validatePatientAccess(context.userId, patientId, context.role);
    
    const orders = await context.prisma.order.findMany({
      where: { patientId },
      include: {
        orderItems: {
          include: {
            product: {
              select: { product_name: true, unit: true }
            }
          }
        },
        payments: true
      },
      orderBy: { order_date: 'desc' }
    });
    
    return orders;
  },

  // Supplier & Purchase Queries
  async suppliers(parent: any, args: any, context: any) {
    const { pagination } = args;
    context.security.requireStaff(context);
    
    context.security.validatePagination(pagination);
    
    const suppliers = await context.prisma.supplier.findMany({
      skip: pagination?.skip || 0,
      take: pagination?.take || 10,
      include: {
        purchases: {
          orderBy: { purchase_date: 'desc' },
          take: 3
        }
      },
      orderBy: { name: 'asc' }
    });
    
    return suppliers;
  },

  async supplier(parent: any, args: any, context: any) {
    const { id } = args;
    context.security.requireStaff(context);
    context.security.validateId(id);
    
    const supplier = await context.prisma.supplier.findUnique({
      where: { id },
      include: {
        purchases: {
          orderBy: { purchase_date: 'desc' },
          include: {
            purchaseItems: {
              include: {
                product: {
                  select: { product_name: true }
                }
              }
            }
          }
        }
      }
    });
    
    if (!supplier) {
      throw new GraphQLError('Supplier not found');
    }
    
    return supplier;
  },

  async purchases(parent: any, args: any, context: any) {
    const { pagination } = args;
    context.security.requireStaff(context);
    
    context.security.validatePagination(pagination);
    
    const purchases = await context.prisma.purchase.findMany({
      skip: pagination?.skip || 0,
      take: pagination?.take || 10,
      include: {
        supplier: {
          select: { name: true }
        },
        user: {
          select: { username: true }
        },
        purchaseItems: {
          include: {
            product: {
              select: { product_name: true }
            }
          }
        }
      },
      orderBy: { purchase_date: 'desc' }
    });
    
    return purchases;
  },

  async purchase(parent: any, args: any, context: any) {
    const { id } = args;
    context.security.requireStaff(context);
    context.security.validateId(id);
    
    const purchase = await context.prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        user: {
          select: { id: true, username: true }
        },
        purchaseItems: {
          include: {
            product: true
          }
        }
      }
    });
    
    if (!purchase) {
      throw new GraphQLError('Purchase not found');
    }
    
    return purchase;
  },

  // Category Queries
  async categories(parent: any, args: any, context: any) {
    context.security.requireStaff(context);
    
    const categories = await context.prisma.category.findMany({
      orderBy: [
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: { products: true }
        }
      }
    });
    
    return categories;
  },

  async category(parent: any, args: any, context: any) {
    const { id } = args;
    context.security.requireStaff(context);
    context.security.validateId(id);
    
    const category = await context.prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            product_name: true,
            status: true,
            stock_quantity: true
          }
        },
        _count: {
          select: { products: true }
        }
      }
    });
    
    if (!category) {
      throw new GraphQLError('Category not found');
    }
    
    return category;
  }
}; 