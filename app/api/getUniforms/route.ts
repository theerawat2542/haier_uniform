// src/app/api/getUniforms/route.ts
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
  try {

    const client = new Client(dbConfig);
    await client.connect();

    // ดึงรายการยูนิฟอร์ม + ไซส์ + stock
    const result = await client.query(
      `
      SELECT 
        i.id AS item_id,
        i.item_name,
        i.category,
        s.id AS size_id,
        s.size,
        s.stock
      FROM uniform_items i
      INNER JOIN uniform_sizes s ON s.uniform_id = i.id
      ORDER BY i.item_name, s.size;
      `
    );

    await client.end();

    return NextResponse.json({ data: result.rows }, { status: 200 });
  } catch (err: any) {
    console.error("❌ getUniforms error:", err);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลยูนิฟอร์มได้" },
      { status: 500 }
    );
  }
}
