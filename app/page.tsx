"use client";

import React, { useState } from "react";
import Navbar from "./components/Navbar/Navbar";
import {
  Input,
  Button,
  Select,
  InputNumber,
  Card,
  Divider,
  Space,
  Typography,
} from "antd";
import toast from "react-hot-toast";

const { Option } = Select;
const { Title, Text } = Typography;

interface Uniform {
  item_id: number;
  item_name: string;
  category: string;
  size_id: number;
  size: string;
  stock: number;
  quantity?: number;
}

const Page: React.FC = () => {
  const [workId, setWorkId] = useState("");
  const [employee, setEmployee] = useState<any[]>([]);
  const [uniforms, setUniforms] = useState<Uniform[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUniforms, setSelectedUniforms] = useState<
    { uniform_id: number; size_id: number; quantity: number }[]
  >([]);
  const [selectedSize, setSelectedSize] = useState<{ [key: number]: number }>(
    {}
  );
  const [isLocked, setIsLocked] = useState(false);

  const handleSearch = async () => {
    if (!workId.trim()) {
      toast.error("กรุณากรอกรหัสพนักงานก่อนค้นหา ⚠️");
      return;
    }

    setLoading(true);
    setEmployee([]);
    setUniforms([]);
    setSelectedUniforms([]);
    setSelectedSize({});

    try {
      const res = await fetch("/api/searchEmp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workId }),
      });

      const data = await res.json();

      if (!res.ok || !data.data) {
        toast.error("ไม่พบพนักงานในฐานข้อมูล");
        return;
      }

      setEmployee([data.data]);
      // toast.success(`พบพนักงาน ${data.data.htcpersonid} ✅`);
      setIsLocked(true); // ✅ ล็อคช่องกรอกหลังค้นหาสำเร็จ

      const resUniforms = await fetch("/api/getUniforms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const uniformData = await resUniforms.json();

      if (resUniforms.ok && uniformData.data?.length > 0) {
        setUniforms(uniformData.data);
      } else {
        toast.error("ไม่พบรายการยูนิฟอร์ม");
      }
    } catch (err) {
      console.error(err);
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setWorkId("");
    setEmployee([]);
    setUniforms([]);
    setSelectedUniforms([]);
    setSelectedSize({});
    setIsLocked(false); // ✅ ปลดล็อคช่องกรอกเมื่อกดล้าง
    toast("เริ่มค้นหาใหม่ได้เลย 🔄");
  };

  const handleSelectUniform = (
    uniform_id: number,
    size_id: number,
    quantity: number
  ) => {
    setSelectedUniforms((prev) => {
      // ถ้า quantity = 0 หรือ size_id = 0 ให้ลบ entry ออก
      if (quantity === 0 || size_id === 0) {
        return prev.filter(
          (u) => !(u.uniform_id === uniform_id && u.size_id === size_id)
        );
      }

      const exist = prev.find(
        (u) => u.uniform_id === uniform_id && u.size_id === size_id
      );
      if (exist) {
        return prev.map((u) =>
          u.uniform_id === uniform_id && u.size_id === size_id
            ? { ...u, quantity }
            : u
        );
      } else {
        return [...prev, { uniform_id, size_id, quantity }];
      }
    });
  };

  const handleSubmit = async () => {
    if (!employee[0]) {
      toast.error("กรุณาค้นหาพนักงานก่อน");
      return;
    }

    if (!selectedUniforms || selectedUniforms.length === 0) {
      toast.error("กรุณาเลือกยูนิฟอร์มก่อน");
      return;
    }

    const totalSelected = selectedUniforms.reduce(
      (sum: number, u) => sum + (u.quantity || 0),
      0
    );

    if (totalSelected > 4) {
      toast.error("ไม่สามารถเบิกเกิน 4 ชิ้นได้");
      return;
    }

    try {
      const checkRes = await fetch("/api/checkTodayRequisition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ htcpersonid: employee[0].htcpersonid }),
      });

      const checkData = await checkRes.json();

      if (!checkRes.ok) {
        toast.error(checkData.error || "ตรวจสอบยอดเบิกวันนี้ล้มเหลว ❌");
        return;
      }

      if (checkData.total >= 4) {
        toast("รหัสพนักงานนี้เบิกครบ 4 ชิ้นแล้ววันนี้", { icon: "⚠️" });
        return;
      }

      if (totalSelected + checkData.total > 4) {
        toast.error(
          `เบิกเกิน 4 ชิ้นวันนี้ ❌ (เบิกไปแล้ว ${checkData.total} ชิ้น)`
        );
        return;
      }

      const res = await fetch("/api/requisitionUniform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          htcpersonid: employee[0].htcpersonid,
          uniforms: selectedUniforms,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("บันทึกการเบิกสำเร็จ ✅");
        setSelectedUniforms([]);
        setSelectedSize({});
        handleSearch();
      } else {
        toast.error("บันทึกไม่สำเร็จ");
      }
    } catch (err) {
      console.error(err);
      toast.error("เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว");
    }
  };

  const groupedByCategory = uniforms.reduce((acc: any, u) => {
    if (!acc[u.category]) acc[u.category] = {};
    if (!acc[u.category][u.item_name]) acc[u.category][u.item_name] = [];
    acc[u.category][u.item_name].push(u);
    return acc;
  }, {});

  return (
    <div
      style={{
        background: "#f0f2f5",
        minHeight: "100vh",
        flexDirection: "column",
      }}
    >
      <Navbar />
      <div style={{ maxWidth: 900, margin: "20px auto", padding: "0 16px" }}>
        <Title
          level={2}
          style={{
            textAlign: "center",
            marginBottom: 30,
            color: "#1890ff",
            textShadow: "1px 1px 2px rgba(0,0,0,0.2)",
          }}
        >
          เบิกชุด Uniforms พนักงาน
        </Title>

        {/* Search Section */}
        <Card
          style={{
            marginBottom: 20,
            borderRadius: 16,
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Space size="middle">
              <span style={{ fontWeight: 500 }}>Work ID:</span>
              <Input
                value={workId}
                onChange={(e) => setWorkId(e.target.value)}
                placeholder="กรอกรหัสพนักงาน"
                style={{ width: 220, borderRadius: 8 }}
                onPressEnter={handleSearch}
                disabled={isLocked} // ✅ ล็อคช่องกรอกเมื่อค้นหาแล้ว
              />
              <Button
                type="primary"
                onClick={handleSearch}
                loading={loading}
                style={{ borderRadius: 8 }}
                disabled={isLocked}
              >
                ค้นหา
              </Button>
              <Button danger onClick={handleClear} style={{ borderRadius: 8 }}>
                ล้าง
              </Button>
            </Space>
          </div>
        </Card>

        {/* Employee Info */}
        {employee.length > 0 && (
          <Card
            style={{
              marginBottom: 20,
              borderRadius: 16,
              backdropFilter: "blur(8px)",
            }}
          >
            <Title level={4} style={{ color: "#0050b3" }}>
              ข้อมูลพนักงาน
            </Title>
            <Divider />
            <Text strong>รหัส: </Text>
            <Text>{employee[0].htcpersonid}</Text>
            <br />
            <Text strong>ชื่อ: </Text>
            <Text>{employee[0].personname}</Text>
            <br />
            <Text strong>กลุ่ม: </Text>
            <Text>{employee[0].persongroup}</Text>
          </Card>
        )}

        {/* Uniform Selection */}
        {Object.keys(groupedByCategory).length > 0 && (
          <Card
            style={{
              backdropFilter: "blur(10px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            }}
          >
            <Title level={4} style={{ color: "#0050b3" }}>
              เลือกยูนิฟอร์ม
            </Title>
            <Divider />

            {Object.keys(groupedByCategory).map((category) => (
              <div key={category} style={{ marginBottom: 24 }}>
                <Title level={5} style={{ marginBottom: 12, color: "#1890ff" }}>
                  {category}
                </Title>

                {Object.keys(groupedByCategory[category]).map((item_name) => {
                  const uniform_id =
                    groupedByCategory[category][item_name][0].item_id;

                  return (
                    <Card
                      key={item_name}
                      type="inner"
                      title={item_name}
                      style={{
                        marginBottom: 16,
                        borderRadius: 12,
                        border: "1px solid rgba(0,0,0,0.1)",
                        background: "rgba(255,255,255,0.05)",
                      }}
                    >
                      <Space size="middle">
                        <Select
                          placeholder="เลือกไซส์"
                          style={{ width: 180, borderRadius: 8 }}
                          value={selectedSize[uniform_id] ?? undefined}
                          onChange={(size_id: number | null) => {
                            if (!size_id) {
                              // Clear select
                              setSelectedSize((prev) => {
                                const copy = { ...prev };
                                delete copy[uniform_id];
                                return copy;
                              });
                              setSelectedUniforms((prev) =>
                                prev.filter((u) => u.uniform_id !== uniform_id)
                              );
                            } else {
                              setSelectedSize((prev) => ({
                                ...prev,
                                [uniform_id]: size_id,
                              }));
                              handleSelectUniform(uniform_id, size_id, 0);
                            }
                          }}
                          allowClear
                        >
                          {groupedByCategory[category][item_name].map(
                            (u: Uniform) => (
                              <Option
                                key={u.size_id}
                                value={u.size_id}
                                disabled={u.stock === 0}
                              >
                                <b>{u.size}</b> - (stock: {u.stock})
                              </Option>
                            )
                          )}
                        </Select>

                        <InputNumber
                          min={0}
                          max={
                            groupedByCategory[category][item_name].find(
                              (u: Uniform) =>
                                u.size_id === selectedSize[uniform_id]
                            )?.stock || 0
                          }
                          placeholder="Quantity"
                          value={
                            selectedSize[uniform_id]
                              ? selectedUniforms.find(
                                  (u) =>
                                    u.uniform_id === uniform_id &&
                                    u.size_id === selectedSize[uniform_id]
                                )?.quantity
                              : undefined
                          }
                          onChange={(val: number | null) => {
                            if (
                              !selectedSize[uniform_id] ||
                              val === null ||
                              val <= 0
                            ) {
                              // Clear quantity
                              setSelectedUniforms((prev) =>
                                prev.filter((u) => u.uniform_id !== uniform_id)
                              );
                            } else {
                              handleSelectUniform(
                                uniform_id,
                                selectedSize[uniform_id],
                                val
                              );
                            }
                          }}
                          style={{ borderRadius: 8 }}
                        />
                      </Space>
                    </Card>
                  );
                })}
              </div>
            ))}

            <div style={{ textAlign: "center", marginTop: 20 }}>
              <Button
                type="primary"
                size="large"
                onClick={handleSubmit}
                style={{
                  borderRadius: 12,
                  padding: "0 30px",
                  fontSize: 16,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                บันทึกการเบิก
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Page;
