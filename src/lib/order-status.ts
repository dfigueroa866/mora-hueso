export function orderStatusLabel(status: string) {
  switch (status) {
    case "pending_payment":
      return "Pago pendiente";
    case "paid":
      return "Pagado";
    case "cancelled":
      return "Cancelado";
    case "shipped":
      return "Enviado";
    case "confirmed":
      return "Confirmado";
    default:
      return status;
  }
}
