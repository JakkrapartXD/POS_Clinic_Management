import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateExistingData() {
  try {
    console.log('🔄 Starting to update existing data with product names and units...')

    // Update OrderItem records
    console.log('📦 Updating OrderItem records...')
    const orderItems = await prisma.orderItem.findMany({
      where: {
        OR: [
          { product_name: null },
          { product_unit: null }
        ]
      },
      include: {
        product: {
          select: {
            product_name: true,
            unit: true
          }
        }
      }
    })

    for (const orderItem of orderItems) {
      if (orderItem.product) {
        await prisma.orderItem.update({
          where: { id: orderItem.id },
          data: {
            product_name: orderItem.product.product_name,
            product_unit: orderItem.product.unit
          }
        })
      }
    }
    console.log(`✅ Updated ${orderItems.length} OrderItem records`)

    // Update PurchaseItem records
    console.log('📦 Updating PurchaseItem records...')
    const purchaseItems = await prisma.purchaseItem.findMany({
      where: {
        OR: [
          { product_name: null },
          { product_unit: null }
        ]
      },
      include: {
        product: {
          select: {
            product_name: true,
            unit: true
          }
        }
      }
    })

    for (const purchaseItem of purchaseItems) {
      if (purchaseItem.product) {
        await prisma.purchaseItem.update({
          where: { id: purchaseItem.id },
          data: {
            product_name: purchaseItem.product.product_name,
            product_unit: purchaseItem.product.unit
          }
        })
      }
    }
    console.log(`✅ Updated ${purchaseItems.length} PurchaseItem records`)

    // Update Prescription records
    console.log('📦 Updating Prescription records...')
    const prescriptions = await prisma.prescription.findMany({
      where: {
        OR: [
          { product_name: null },
          { product_unit: null }
        ]
      },
      include: {
        product: {
          select: {
            product_name: true,
            unit: true
          }
        }
      }
    })

    for (const prescription of prescriptions) {
      if (prescription.product) {
        await prisma.prescription.update({
          where: { id: prescription.id },
          data: {
            product_name: prescription.product.product_name,
            product_unit: prescription.product.unit
          }
        })
      }
    }
    console.log(`✅ Updated ${prescriptions.length} Prescription records`)

    // Update StockMovement records
    console.log('📦 Updating StockMovement records...')
    const stockMovements = await prisma.stockMovement.findMany({
      where: {
        OR: [
          { product_name: null },
          { product_unit: null }
        ]
      },
      include: {
        product: {
          select: {
            product_name: true,
            unit: true
          }
        }
      }
    })

    for (const stockMovement of stockMovements) {
      if (stockMovement.product) {
        await prisma.stockMovement.update({
          where: { id: stockMovement.id },
          data: {
            product_name: stockMovement.product.product_name,
            product_unit: stockMovement.product.unit
          }
        })
      }
    }
    console.log(`✅ Updated ${stockMovements.length} StockMovement records`)

    // Update SalesReport records
    console.log('📦 Updating SalesReport records...')
    const salesReports = await prisma.salesReport.findMany({
      where: {
        OR: [
          { product_name: null },
          { product_unit: null }
        ]
      },
      include: {
        product: {
          select: {
            product_name: true,
            unit: true
          }
        }
      }
    })

    for (const salesReport of salesReports) {
      if (salesReport.product) {
        await prisma.salesReport.update({
          where: { id: salesReport.id },
          data: {
            product_name: salesReport.product.product_name,
            product_unit: salesReport.product.unit
          }
        })
      }
    }
    console.log(`✅ Updated ${salesReports.length} SalesReport records`)

    // Update StockAlert records
    console.log('📦 Updating StockAlert records...')
    const stockAlerts = await prisma.stockAlert.findMany({
      where: {
        OR: [
          { product_name: null },
          { product_unit: null }
        ]
      },
      include: {
        product: {
          select: {
            product_name: true,
            unit: true
          }
        }
      }
    })

    for (const stockAlert of stockAlerts) {
      if (stockAlert.product) {
        await prisma.stockAlert.update({
          where: { id: stockAlert.id },
          data: {
            product_name: stockAlert.product.product_name,
            product_unit: stockAlert.product.unit
          }
        })
      }
    }
    console.log(`✅ Updated ${stockAlerts.length} StockAlert records`)

    console.log('🎉 All existing data has been updated successfully!')
    console.log('📋 Summary:')
    console.log(`   - OrderItems: ${orderItems.length}`)
    console.log(`   - PurchaseItems: ${purchaseItems.length}`)
    console.log(`   - Prescriptions: ${prescriptions.length}`)
    console.log(`   - StockMovements: ${stockMovements.length}`)
    console.log(`   - SalesReports: ${salesReports.length}`)
    console.log(`   - StockAlerts: ${stockAlerts.length}`)

  } catch (error) {
    console.error('❌ Error updating existing data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the update
updateExistingData()
  .then(() => {
    console.log('✅ Update completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Update failed:', error)
    process.exit(1)
  })
