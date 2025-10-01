import Image from "next/image";
import reactLogo from "../assets/Haier.png";
import "./Navbar.css";
import { FileTextOutlined, ToolOutlined, HomeOutlined } from "@ant-design/icons"; 
import { useRouter } from "next/navigation";

const Navbar: React.FC = () => {
  const router = useRouter();

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Image src={reactLogo} alt="HaierLogo" className="logo-image" />
      </div>

      {/* ปุ่มต่างๆ */}
      <div className="navbar-actions" style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
        
        {/* หน้าแรก */}
        <button
          style={{
            backgroundColor: "#fa8c16",
            color: "#fff",
            border: "none",
            padding: "6px 16px",
            borderRadius: 4,
            cursor: "pointer",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          onClick={() => router.push("/")}
        >
          <HomeOutlined />
          เบิกยูนิฟอร์ม
        </button>

        {/* รายงาน */}
        <button
          style={{
            backgroundColor: "#1890ff",
            color: "#fff",
            border: "none",
            padding: "6px 16px",
            borderRadius: 4,
            cursor: "pointer",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          onClick={() => router.push("/report")}
        >
          <FileTextOutlined />
          รายงาน
        </button>

        {/* ปรับ Stock */}
        <button
          style={{
            backgroundColor: "#52c41a",
            color: "#fff",
            border: "none",
            padding: "6px 16px",
            borderRadius: 4,
            cursor: "pointer",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          onClick={() => router.push("/stock")}
        >
          <ToolOutlined />
          ปรับ Stock
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
