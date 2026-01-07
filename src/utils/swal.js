import Swal from "sweetalert2";

export const swal = {
  success: (title, text) =>
    Swal.fire({
      icon: "success",
      title,
      text,
      confirmButtonText: "확인",
    }),

  error: (title, text) =>
    Swal.fire({
      icon: "error",
      title,
      text,
      confirmButtonText: "확인",
    }),

  info: (title, text) =>
    Swal.fire({
      icon: "info",
      title,
      text,
      confirmButtonText: "확인",
    }),

  warn: (title, text) =>
    Swal.fire({
      icon: "warning",
      title,
      text,
      confirmButtonText: "확인",
    }),

  confirm: async ({
    title,
    text,
    confirmButtonText = "확인",
    cancelButtonText = "취소",
    icon = "warning",
  }) => {
    const result = await Swal.fire({
      icon,
      title,
      text,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      reverseButtons: true,
      focusCancel: true,
    });
    return result.isConfirmed;
  },

  toast: ({ icon = "success", title, timer = 1800 } = {}) =>
    Swal.fire({
      toast: true,
      position: "top-end",
      icon,
      title,
      showConfirmButton: false,
      timer,
      timerProgressBar: true,
    }),
};


