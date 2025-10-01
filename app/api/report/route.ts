import { NextResponse } from "next/server";
import { Client } from "pg";

const dbConfig = {
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
};

export async function POST(req: Request) {
  const client = new Client(dbConfig);

  try {
    const { startDate, endDate } = await req.json();

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "กรุณาระบุช่วงวันที่" },
        { status: 400 }
      );
    }

    await client.connect();

    // Query: join uniforms_transaction -> tbscantime, uniform_items, uniform_sizes
    const res = await client.query(
      `
SELECT 
  t.htcpersonid,
  s.personname,
  s.persongroup,
  i.item_name,
  sz.size,
  t.quantity,
  t.created_at
FROM uniforms_transaction t
LEFT JOIN LATERAL (
  SELECT personname, persongroup
  FROM tbscantime
  WHERE htcpersonid = t.htcpersonid
  ORDER BY created_at DESC
  LIMIT 1
) s ON true
LEFT JOIN uniform_items i ON t.uniform_id = i.id
LEFT JOIN uniform_sizes sz ON t.size_id = sz.id
WHERE t.created_at BETWEEN $1 AND $2
ORDER BY t.created_at DESC

      `,
      [startDate, endDate]
    );

    return NextResponse.json({ data: res.rows });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}
