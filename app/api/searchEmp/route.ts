import { NextResponse } from "next/server";
import { Client } from "pg";

export async function POST(req: Request) {
  try {
    const { workId } = await req.json();

    if (!workId) {
      return NextResponse.json({ error: "กรุณากรอก Work ID" }, { status: 400 });
    }

    const client = new Client({
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
    });

    await client.connect();

    const result = await client.query(
      `SELECT htcpersonid, personname, persongroup 
       FROM tbscantime 
       WHERE htcpersonid = $1 
       LIMIT 1`,
      [workId]
    );

    await client.end();

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "ไม่พบพนักงาน" }, { status: 404 });
    }

    return NextResponse.json({ data: result.rows[0] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
