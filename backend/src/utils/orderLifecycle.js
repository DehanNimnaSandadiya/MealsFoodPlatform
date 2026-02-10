const allowedTransitions = {
    PLACED: ["ACCEPTED", "CANCELLED"],
    CANCELLED: [],
    ACCEPTED: ["PREPARING"],
    PREPARING: ["READY_FOR_PICKUP"],
    READY_FOR_PICKUP: ["RIDER_ASSIGNED"],
    RIDER_ASSIGNED: ["PICKED_UP"],
    PICKED_UP: ["ON_THE_WAY"],
    ON_THE_WAY: ["DELIVERED"],
    DELIVERED: ["COMPLETED"],
    COMPLETED: [],
  };
  
  export function assertTransition(current, next) {
    const allowed = allowedTransitions[current] || [];
    if (!allowed.includes(next)) {
      const msg = `Invalid transition: ${current} → ${next}`;
      const err = new Error(msg);
      err.code = "INVALID_STATUS_TRANSITION";
      throw err;
    }
  }
  