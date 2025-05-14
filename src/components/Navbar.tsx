import { Typography } from "@mui/material";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function NavigationBar() {
  const session = useSession();
  return (
    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", padding: "0 0 0 16px" }}>
      <Link href="/" style={{ textDecoration: "none", color: "black" }}>
        <h1>SACHEDULE</h1>
      </Link>
      {session.data && session.data.user && (
        <div
          style={{
            margin: 20,
            display: "flex",
            alignItems: "center",
            // backgroundColor: "lightgray",
            borderRadius: 10,
          }}
        >
          <Typography style={{ fontWeight: 400, fontSize: 16 }}>{session.data.user.name}</Typography>
          <div
            style={{
              marginLeft: 10,
              width: 40,
              height: 40,
              background: "linear-gradient(135deg,rgba(87, 199, 133, 1) 0%, rgba(237, 221, 83, 1) 100%)",
              borderRadius: "100%",
            }}
          ></div>
        </div>
      )}
    </div>
  );
}
