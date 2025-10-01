"use client";

import React, { useState } from "react";
import Navbar from "../components/Navbar/Navbar";
import {
  DatePicker,
  Button,
  Table,
  Card,
  Typography,
  Space,
  message,
  Input,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import {
  FileExcelOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface ReportData {
  key: string;
  htcpersonid: string;
  personname: string;
  persongroup: string;
  item_name: string;
  size: string;
  quantity: number;
  created_at: string;
}

const ReportPage: React.FC = () => {
  const [dates, setDates] = useState<[any, any] | null>(null);
  const [data, setData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!dates) {
      message.warning("กรุณาเลือกช่วงวันที่ ⚠️");
      return;
    }

    const startDate = dates[0].format("YYYY-MM-DD");
    const endDate = dates[1].format("YYYY-MM-DD");

    setLoading(true);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate }),
      });

      const result = await res.json();

      if (res.ok) {
        const tableData = result.data.map((row: any, index: number) => ({
          key: index,
          ...row,
        }));
        setData(tableData);
      } else {
        alert(result.error || "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      console.error(err);
      alert("เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!data.length) return;

    const worksheet = XLSX.utils.json_to_sheet(
      data.map((row) => ({
        รหัสพนักงาน: row.htcpersonid,
        ชื่อ: row.personname,
        กลุ่ม: row.persongroup,
        ยูนิฟอร์ม: row.item_name,
        ไซส์: row.size,
        จำนวน: row.quantity,
        วันที่เบิก: dayjs(row.created_at).format("YYYY-MM-DD HH:mm:ss"),
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    const today = dayjs().format("YYYY-MM-DD");
    XLSX.writeFile(workbook, `uniform_report_${today}.xlsx`);
  };

  const columns: ColumnsType<ReportData> = [
    {
      title: "รหัสพนักงาน",
      dataIndex: "htcpersonid",
      key: "htcpersonid",
      width: 140,
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="ค้นหารหัส"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: "block", width: 200 }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              size="small"
              icon={<SearchOutlined />}
            >
              ค้นหา
            </Button>
            <Button
              onClick={() => clearFilters && clearFilters()}
              size="small"
              icon={<ReloadOutlined />}
            >
              รีเซ็ต
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      onFilter: (value, record) =>
        record.htcpersonid
          .toLowerCase()
          .includes((value as string).toLowerCase()),
    },
    { title: "ชื่อ", dataIndex: "personname", key: "personname", width: 160 },
    {
      title: "กลุ่ม",
      dataIndex: "persongroup",
      key: "persongroup",
      width: 160,
    },
    {
      title: "ยูนิฟอร์ม",
      dataIndex: "item_name",
      key: "item_name",
      width: 220,
    },
    { title: "ไซส์", dataIndex: "size", key: "size", width: 100 },
    { title: "จำนวน", dataIndex: "quantity", key: "quantity", width: 100 },
    {
      title: "วันที่เบิก",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (value: string) => dayjs(value).format("YYYY-MM-DD HH:mm:ss"),
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
      <div style={{ maxWidth: 1200, margin: "20px auto", padding: "0 16px" }}>
        <Title
          level={2}
          style={{
            textAlign: "center",
            marginBottom: 30,
            color: "#1890ff",
            textShadow: "1px 1px 2px rgba(0,0,0,0.15)",
          }}
        >
          รายงานการเบิก Uniform
        </Title>

        {/* Filter Card */}
        <Card
          style={{
            marginBottom: 20,
            borderRadius: 16,
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            background: "#ffffff",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Space size="middle" wrap>
            <span style={{ fontWeight: 500 }}>เลือกช่วงวันที่:</span>
            <RangePicker
              onChange={(values) => setDates(values as [any, any])}
            />
            <Button type="primary" onClick={handleSearch} loading={loading}>
              ค้นหา
            </Button>
            <Tooltip title="ดาวน์โหลดรายงาน Excel">
              <Button
                type="default"
                onClick={handleExport}
                disabled={!data.length}
                icon={<FileExcelOutlined style={{ color: "#1d6f42" }} />}
              >
                ดาวน์โหลด
              </Button>
            </Tooltip>
          </Space>
        </Card>

        {/* Table Card */}
        <Card
          style={{
            borderRadius: 16,
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            background: "#ffffff",
          }}
        >
          <Table
            columns={columns}
            dataSource={data}
            loading={loading}
            bordered
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1000 }}
            style={{ whiteSpace: "nowrap" }}
            rowClassName={() => "custom-table-row"}
            size="small"
          />
        </Card>
      </div>
    </div>
  );
};

export default ReportPage;
