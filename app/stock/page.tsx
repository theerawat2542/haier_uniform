"use client";

import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar/Navbar";
import { Table, Button, Card, Typography, InputNumber, message, Select, Space } from "antd";
import type { ColumnsType } from "antd/es/table";

const { Title } = Typography;
const { Option } = Select;

interface SizeData {
  size_id: number;
  size: string;
  stock: number;
  adjustment?: number;
}

interface ItemData {
  item_id: number;
  item_name: string;
  sizes: SizeData[];
}

const StockPage: React.FC = () => {
  const [items, setItems] = useState<ItemData[]>([]);
  const [selectedItem, setSelectedItem] = useState<ItemData | null>(null);
  const [loading, setLoading] = useState(false);

  // ดึงรายการยูนิฟอร์ม + ไซส์
  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stock/items");
      const result = await res.json();
      if (result.ok) setItems(result.data);
      else message.error(result.error || "ดึงรายการยูนิฟอร์มล้มเหลว");
    } catch (err) {
      console.error(err);
      message.error("เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // ปรับ Stock แบบ batch
  const handleBatchAdjust = async () => {
    if (!selectedItem) return;

    const adjustments: { size_id: number; adjustment: number }[] = selectedItem.sizes
      .filter((s: SizeData) => s.adjustment && s.adjustment !== 0)
      .map((s: SizeData) => ({ size_id: s.size_id, adjustment: s.adjustment! }));

    if (!adjustments.length) {
      alert("กรุณาระบุจำนวนปรับ Stock อย่างน้อยหนึ่งไซส์");
      return;
    }

    try {
      const res = await fetch("/api/stock/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adjustments }),
      });
      const result = await res.json();

      if (result.ok) {
        alert("ปรับ Stock เรียบร้อยแล้ว");

        // ดึงข้อมูลใหม่ของยูนิฟอร์มทั้งหมด
        const resItems = await fetch("/api/stock/items");
        const dataItems = await resItems.json();
        if (dataItems.ok) {
          setItems(dataItems.data);

          // ตั้ง selectedItem ใหม่จากข้อมูลที่รีเฟรชแล้ว
          const updatedItem = dataItems.data.find((i: ItemData) => i.item_id === selectedItem.item_id);
          if (updatedItem) {
            setSelectedItem({
              ...updatedItem,
              sizes: updatedItem.sizes.map((s: SizeData) => ({ ...s, adjustment: 0 })), // รีเซ็ต adjustment
            });
          }
        }
      } else {
        alert(result.error || "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      console.error(err);
      alert("เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว");
    }
  };

  const columns: ColumnsType<SizeData> = [
    { title: "ไซส์", dataIndex: "size", key: "size", width: 120 },
    { title: "Stock ปัจจุบัน", dataIndex: "stock", key: "stock", width: 150 },
    {
      title: "ปรับ Stock",
      dataIndex: "adjustment",
      key: "adjustment",
      width: 150,
      render: (_, record: SizeData) => (
        <InputNumber
          min={-9999}
          max={9999}
          value={record.adjustment ?? 0}
          onChange={(value) => {
            if (!selectedItem) return;
            const newSizes = selectedItem.sizes.map((s: SizeData) =>
              s.size_id === record.size_id ? { ...s, adjustment: value ?? 0 } : s
            );
            setSelectedItem({ ...selectedItem, sizes: newSizes });
          }}
          style={{ width: "100%" }}
        />
      ),
    },
  ];

  return (
    <div
      style={{
        background: "#f0f2f5",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Navbar />
      <div style={{ maxWidth: 1200, margin: "20px auto", padding: "0 16px", flex: 1 }}>
        <Title
          level={2}
          style={{
            textAlign: "center",
            marginBottom: 30,
            color: "#1890ff",
            textShadow: "1px 1px 2px rgba(0,0,0,0.15)",
          }}
        >
          ปรับ Stock ยูนิฟอร์ม
        </Title>

        <Card
          style={{
            marginBottom: 20,
            borderRadius: 16,
            background: "rgba(255,255,255,0.9)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          }}
        >
          <Space direction="horizontal" size="middle" wrap>
            <span style={{ fontWeight: 500 }}>เลือกยูนิฟอร์ม:</span>
            <Select
              style={{ width: 280 }}
              placeholder="เลือกยูนิฟอร์ม"
              value={selectedItem?.item_id}
              onChange={(value) => {
                const item = items.find((i) => i.item_id === value) || null;
                if (item) {
                  const resetItem = {
                    ...item,
                    sizes: item.sizes.map((s: SizeData) => ({ ...s, adjustment: 0 })),
                  };
                  setSelectedItem(resetItem);
                } else {
                  setSelectedItem(null);
                }
              }}
              allowClear
            >
              {items.map((item) => (
                <Option key={item.item_id} value={item.item_id}>
                  {item.item_name}
                </Option>
              ))}
            </Select>

            <Button
              type="primary"
              onClick={handleBatchAdjust}
              disabled={
                !selectedItem ||
                !selectedItem.sizes.some((s) => s.adjustment && s.adjustment !== 0)
              }
            >
              ปรับ Stock
            </Button>
          </Space>
        </Card>

        {selectedItem && (
          <Card
            style={{
              borderRadius: 16,
              background: "rgba(255,255,255,0.9)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            }}
          >
            <Table
              columns={columns}
              dataSource={selectedItem.sizes.map((s: SizeData) => ({ ...s, key: s.size_id }))}
              loading={loading}
              bordered
              pagination={false}
              scroll={{ x: 500 }}
              style={{ whiteSpace: "nowrap" }}
            />
          </Card>
        )}
      </div>
    </div>
  );
};

export default StockPage;