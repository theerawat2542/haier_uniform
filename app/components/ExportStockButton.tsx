"use client";

import React from "react";
import { Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";

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

interface ExportStockButtonProps {
  items: ItemData[];
}

const ExportStockButton: React.FC<ExportStockButtonProps> = ({ items }) => {
  const handleExport = () => {
    const data: any[] = [];

    items.forEach((item) => {
      item.sizes.forEach((s) => {
        data.push({
          "ยูนิฟอร์ม": item.item_name,
          "ไซส์": s.size,
          "Stock ปัจจุบัน": s.stock,
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stock");

    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

    XLSX.writeFile(workbook, `CurrentStock_${yyyy}${mm}${dd}.xlsx`);
  };

  return (
    <Button type="default" icon={<DownloadOutlined />} onClick={handleExport}>
      ดาวน์โหลด
    </Button>
  );
};

export default ExportStockButton;
