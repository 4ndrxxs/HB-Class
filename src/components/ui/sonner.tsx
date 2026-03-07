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
          border: "1px solid #E5E7EB",
          color: "#1B1D2A",
          borderRadius: "1rem",
        },
      }}
    />
  )
}

export { Toaster }
