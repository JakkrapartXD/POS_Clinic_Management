import { differenceInCalendarDays, startOfDay, endOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const TZ = "Asia/Bangkok";
const DEFAULT_WARN_DAYS = 30;

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function colorFromPercent(p: number): "yellow" | "orange" | "red" | "black" {
  if (p > 80) return "yellow";
  if (p > 40) return "orange";
  if (p > 10) return "red";
  return "black";
}

function getDayRangeInBangkok(date?: Date) {
  const base = date ? new Date(date) : new Date();
  const zoned = toZonedTime(base, TZ);
  const start = startOfDay(zoned);
  const end = endOfDay(zoned);
  return { start, end };
}

export const notificationQueries = {
  stockExpiryAlerts: async (_: any, args: { skip?: number; take?: number; search?: string }, ctx: any) => {
    const { skip = 0, take = 100, search } = args;

    const stocks = await ctx.prisma.stock.findMany({
      where: {
        quantity: { gt: 0 },
        expiration_date: { not: null },
        ...(search
          ? {
              OR: [
                { product: { product_name: { contains: search, mode: "insensitive" } } },
                { product: { sku: { contains: search, mode: "insensitive" } } },
                { product: { barcode: { contains: search, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: {
        product: {
          select: {
            id: true,
            product_name: true,
            sku: true,
            unit: true,
            expiration_warning_date: true,
            shelf_code: true,
            shelf_row: true,
            barcode: true,
            category: { select: { name: true } },
          },
        },
      },
    });

    const nowBn = toZonedTime(new Date(), TZ);

    const mapped = stocks
      .map((s: any) => {
        const exp: Date | null = s.expiration_date;
        if (!exp) return null;

        const warnDays: number = s.product.expiration_warning_date ?? DEFAULT_WARN_DAYS;
        if (!Number.isFinite(warnDays) || warnDays <= 0) return null;

        const daysLeft = differenceInCalendarDays(exp, nowBn);
        const pct = clamp((daysLeft / warnDays) * 100, 0, 100);

        // แสดงเฉพาะที่เข้าช่วงเตือน (<= warnDays)
        if (daysLeft > warnDays) return null;

        return {
          stock_id: s.id,
          product_id: s.productId,
          product_name: s.product.product_name,
          sku: s.product.sku,
          unit: s.product.unit,
          quantity: s.quantity,
          expiration_date: exp,
          days_left: Math.max(daysLeft, 0),
          warn_days: warnDays,
          percent_remaining: pct,
          color: colorFromPercent(pct),
          shelf_code: s.product.shelf_code,
          shelf_row: s.product.shelf_row,
          barcode: s.product.barcode,
          category: s.product.category?.name ?? null,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => {
        if (a.percent_remaining !== b.percent_remaining) return a.percent_remaining - b.percent_remaining;
        return a.days_left - b.days_left;
      });

    const total = mapped.length;
    const items = mapped.slice(skip, skip + take);
    return { items, total };
  },

  todaysAppointments: async (_: any, args: { date?: string; skip?: number; take?: number; status?: string }, ctx: any) => {
    const { date, skip = 0, take = 100, status } = args;
    const { start, end } = getDayRangeInBangkok(date ? new Date(date) : undefined);

    const where: any = {
      appointment_time: { gte: start, lt: end },
    };
    if (status) where.status = status;

    const [apps, total] = await Promise.all([
      ctx.prisma.appointment.findMany({
        where,
        include: {
          patient: { select: { first_name: true, last_name: true } },
          doctor: { select: { id: true, username: true, email: true } },
        },
        orderBy: { appointment_time: "asc" },
        skip,
        take,
      }),
      ctx.prisma.appointment.count({ where }),
    ]);

    const items = apps.map((a: any) => ({
      appointment_id: a.id,
      time: a.appointment_time,
      status: a.status,
      reason: a.reason,
      patient_id: a.patientId,
      patient_fullname: `${a.patient.first_name} ${a.patient.last_name}`,
      doctor_id: a.doctorId,
      doctor_name: a.doctor?.username ?? a.doctor?.email ?? null,
    }));

    return { items, total };
  },

  notificationsOverview: async (_: any, args: { date?: string }, ctx: any) => {
    const [stocks, appointments] = await Promise.all([
      notificationQueries.stockExpiryAlerts(_, { skip: 0, take: 50 }, ctx),
      notificationQueries.todaysAppointments(_, { date: args.date, skip: 0, take: 50 }, ctx),
    ]);
    return { stocks, appointments };
  },
};
