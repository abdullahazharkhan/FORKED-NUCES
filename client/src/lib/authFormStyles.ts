export const AUTH_LABEL_CLASS = "text-sm font-semibold text-black/75";

export const AUTH_INPUT_BASE_CLASS =
    "min-h-12 w-full rounded-xl border bg-white px-3.5 text-[15px] text-black outline-none transition-all placeholder:text-black/30 focus:border-primarypurple focus:ring-4 focus:ring-primarypurple/10";

export const AUTH_PRIMARY_BUTTON_CLASS =
    "min-h-12 w-full rounded-xl bg-primarypurple px-5 text-[15px] font-bold text-white shadow-[0_10px_30px_rgba(111,67,254,0.18)] transition-all hover:-translate-y-0.5 hover:bg-black disabled:translate-y-0 disabled:shadow-none";

export const getAuthInputClass = (hasError: boolean) =>
    `${AUTH_INPUT_BASE_CLASS} ${
        hasError
            ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
            : "border-black/15"
    }`;
