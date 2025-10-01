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
    const { htcpersonid, uniforms } = await req.json();
    // uniforms = [{ uniform_id: number, size_id: number, quantity: number }, ...]

    if (!htcpersonid || !Array.isArray(uniforms) || uniforms.length === 0) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    await client.connect();
    await client.query("BEGIN");

    for (const u of uniforms) {
      // ✅ ตรวจสอบ stock
      const checkStock = await client.query(
        `SELECT stock FROM uniform_sizes WHERE id = $1`,
        [u.size_id]
      );

      if (checkStock.rows.length === 0) {
        throw new Error(`ไม่พบ size_id ${u.size_id}`);
      }

      const stock = checkStock.rows[0].stock;
      if (stock < u.quantity) {
        throw new Error(`Stock ไม่พอสำหรับ size_id ${u.size_id}`);
      }

      // ✅ insert ลงตารางใหม่ uniforms_transaction
      await client.query(
        `INSERT INTO uniforms_transaction (htcpersonid, uniform_id, size_id, quantity)
         VALUES ($1, $2, $3, $4)`,
        [htcpersonid, u.uniform_id, u.size_id, u.quantity]
      );

      // ✅ update stock ลดจำนวน
      await client.query(
        `UPDATE uniform_sizes SET stock = stock - $1 WHERE id = $2`,
        [u.quantity, u.size_id]
      );
    }

    await client.query("COMMIT");

    return NextResponse.json({ message: "บันทึกการเบิกสำเร็จ" });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("❌ Error requisition:", err);
    return NextResponse.json({ error: err.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  } finally {
    await client.end();
  }
}
