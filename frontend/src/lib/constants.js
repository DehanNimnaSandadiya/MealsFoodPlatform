export const ROLES = {
  STUDENT: "STUDENT",
  SELLER: "SELLER",
  RIDER: "RIDER",
  ADMIN: "ADMIN",
};

export const ROLE_HOME = {
  STUDENT: "/student",
  SELLER: "/seller",
  RIDER: "/rider",
  ADMIN: "/admin",
};

export function getRoleHome(role) {
  return ROLE_HOME[role] || "/";
}

export const MENU_CATEGORIES = [
  "RICE",
  "CURRY",
  "SAMBOL",
  "SIDE",
  "ADD_ON",
  "DRINK",
];

export const ORDER_STATUS_LABELS = {
  PLACED: "Placed",
  CANCELLED: "Cancelled",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  READY_FOR_PICKUP: "Ready for pickup",
  RIDER_ASSIGNED: "Rider assigned",
  PICKED_UP: "Picked up",
  ON_THE_WAY: "On the way",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
};
