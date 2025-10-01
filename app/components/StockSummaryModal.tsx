"use client";

import React, { useMemo } from "react";
import { Modal, Table, Typography, Card } from "antd";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

interface SizeData {
  size_id: number;
  size: string;
  stock: number;
}

interface ItemData {
  item_id: number;
  item_name: string;
  sizes: SizeData[];
}

interface SummaryRow {
  key: number;
  item_name: string;
  stock: number;
}

interface StockSummaryModalProps {
  visible: boolean;
  onClose: () => void;
  items: ItemData[];
}

const StockSummaryModal: React.FC<StockSummaryModalProps> = ({
  visible,
  onClose,
  items,
}) => {
  // รวม stock ของแต่ละ item
  const summaryData: SummaryRow[] = useMemo(() => {
    return items.map((item) => {
      const totalStock = item.sizes.reduce((sum, s) => sum + (s.stock ?? 0), 0);
      return {
        key: item.item_id,
        item_name: item.item_name,
        stock: totalStock,
      };
    });
  }, [items]);

  const totalAll = summaryData.reduce((sum, item) => sum + item.stock, 0);

  const columns: ColumnsType<SummaryRow> = [
    {
      title: "ยูนิฟอร์ม",
      dataIndex: "item_name",
      key: "item_name",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "คงเหลือทั้งหมด (ชิ้น)",
      dataIndex: "stock",
      key: "stock",
      align: "center",
      render: (v: number) => (
        <Text style={{ color: v > 0 ? "#1677ff" : "red" }}>
          {v.toLocaleString()}
        </Text>
      ),
    },
  ];

  return (
    <Modal
      title={<Title level={4} style={{ margin: 0 }}>📦 สรุปยอด Stock คงเหลือ</Title>}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={650}
      centered
    >
      <Table
        columns={columns}
        dataSource={summaryData}
        pagination={false}
        bordered
        size="middle"
        rowClassName={(_, index) =>
          index % 2 === 0 ? "table-row-light" : "table-row-dark"
        }
      />

      <Card
        style={{
          marginTop: 16,
          textAlign: "right",
          background: "#fafafa",
          borderRadius: 8,
        }}
      >
        <Title level={5} style={{ margin: 0 }}>
          รวมทั้งหมด{" "}
          <Text style={{ color: "#1677ff" }} strong>
            {totalAll.toLocaleString()}
          </Text>{" "}
          ชิ้น
        </Title>
      </Card>
    </Modal>
  );
};

export default StockSummaryModal;
