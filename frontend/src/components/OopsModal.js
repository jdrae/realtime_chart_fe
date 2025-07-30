import React from "react";

const modalStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const boxStyle = {
  background: "#fff",
  padding: "2rem 3rem",
  borderRadius: "8px",
  textAlign: "center",
  minWidth: "300px",
  margin: "auto"
};

export default function OopsModal() {
  return (
    <div style={modalStyle}>
      <div style={boxStyle}>
        <h2>Just updating things!</h2>
        <p>The backend server is currently undergoing an update. 🚧<br />In the meantime, feel free to explore the full source code on <a href="https://github.com/jdrae/realtime_chart" style={{color:"blue"}}>GitHub.</a></p>
      </div>
    </div>
  );
}