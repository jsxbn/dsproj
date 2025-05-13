import { useSession } from "next-auth/react";
import Link from "next/link";

export default function NavigationBar() {
  const session = useSession();
  return (
    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", padding: "0 16px" }}>
      <Link href="/">
        <h1>SACHEDULE</h1>
      </Link>
      {session.data && session.data.user && (
        <div
          style={{
            margin: 20,
            padding: "10px",
            display: "flex",
            alignItems: "center",
            backgroundColor: "lightgray",
            borderRadius: 10,
          }}
        >
          {session.data.user.name}
          <div
            style={{
              marginLeft: 5,
              width: 30,
              height: 30,
              background: "linear-gradient(135deg,rgba(87, 199, 133, 1) 0%, rgba(237, 221, 83, 1) 100%)",
              borderRadius: "100%",
            }}
          ></div>
        </div>
      )}
    </div>
  );
}
