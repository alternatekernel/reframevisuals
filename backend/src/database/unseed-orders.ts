import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SEED_ORDER_CODES = ['RF-SEED01','RF-SEED02','RF-SEED03','RF-SEED04','RF-SEED05','RF-SEED06','RF-SEED07'];
const SEED_CUSTOMER_EMAIL = 'testcustomer@reframevisuals.com';
const SEED_EDITOR_EMAIL = 'alex@reframe.com';
const SEED_QUOTATION_CODE = 'QT-RF-SEED02';

async function main() {
  console.log('\n🗑️  Removing seeded test orders...\n');

  const orders = await prisma.order.findMany({ where: { code: { in: SEED_ORDER_CODES } }, select: { id: true, code: true } });
  const orderIds = orders.map(o => o.id);

  if (orderIds.length) {
    await prisma.image.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.quotation.deleteMany({ where: { code: SEED_QUOTATION_CODE } });
    await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
    console.log(`✅  Deleted ${orderIds.length} orders: ${orders.map(o => o.code).join(', ')}`);
  } else {
    console.log('ℹ️   No seed orders found — nothing to delete.');
  }

  await prisma.user.deleteMany({ where: { email: SEED_CUSTOMER_EMAIL } });
  await prisma.customer.deleteMany({ where: { email: SEED_CUSTOMER_EMAIL } });
  console.log(`✅  Deleted test customer: ${SEED_CUSTOMER_EMAIL}`);

  const editor = await prisma.editor.findUnique({ where: { email: SEED_EDITOR_EMAIL } });
  if (editor) {
    await prisma.editor.delete({ where: { email: SEED_EDITOR_EMAIL } });
    console.log(`✅  Deleted seed editor: ${SEED_EDITOR_EMAIL}`);
  }

  console.log('\n✅  Revert complete.\n');
}

main()
  .catch((e) => { console.error('Revert failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
