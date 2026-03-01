import { Toaster as Sonner } from "sonner"

function Toaster() {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-center"
      toastOptions={{
        style: {
          background: "white",
          border: "1px solid #e5e5e5",
          color: "#0a0a0a",
        },
      }}
    />
  )
}

export { Toaster }
