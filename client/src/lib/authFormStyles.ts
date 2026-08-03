export const AUTH_PAGE_CLASS = "landing-fade-up mx-auto w-full max-w-[36rem]";

export const AUTH_PAGE_WIDE_CLASS =
    "landing-fade-up mx-auto w-full max-w-[44rem]";

export const AUTH_INTRO_CLASS =
    "mb-7 rounded-3xl border border-black/[0.06] bg-white/75 p-6 shadow-[0_14px_40px_rgba(45,23,102,0.06)] backdrop-blur-sm sm:mb-8 sm:p-7";

export const AUTH_STEP_CLASS =
    "flex items-center gap-3 font-[family-name:var(--font-geist-mono)] text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-primarypurple";

export const AUTH_STEP_NUMBER_CLASS =
    "grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-primarypurple/20 bg-primarypurple/[0.07] text-[0.625rem] leading-none";

export const AUTH_ERROR_STEP_CLASS =
    "flex items-center gap-3 font-[family-name:var(--font-geist-mono)] text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-red-600";

export const AUTH_ERROR_STEP_NUMBER_CLASS =
    "grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-red-200 bg-red-50 text-[0.625rem] leading-none text-red-600";

export const AUTH_TITLE_CLASS =
    "mt-5 max-w-2xl text-balance text-[2.25rem] font-semibold leading-[0.98] tracking-[-0.055em] text-black sm:text-[2.75rem]";

export const AUTH_DESCRIPTION_CLASS =
    "mt-4 max-w-[60ch] text-sm leading-6 text-black/55 sm:text-[0.9375rem]";

export const AUTH_FORM_SHELL_CLASS =
    "rounded-3xl border border-black/[0.07] bg-white/95 p-5 shadow-[0_20px_60px_rgba(45,23,102,0.09)] sm:p-7";

export const AUTH_STATUS_SHELL_CLASS =
    "rounded-3xl border border-black/[0.07] bg-white/95 p-6 shadow-[0_20px_60px_rgba(45,23,102,0.09)] sm:p-8";

export const AUTH_LABEL_CLASS =
    "text-[0.8125rem] font-semibold leading-none tracking-[-0.01em] text-black/75";

export const AUTH_TEXT_LINK_CLASS =
    "font-semibold text-primarypurple underline-offset-4 transition-colors duration-200 hover:text-black hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple";

export const AUTH_FOOTER_CLASS =
    "mt-6 border-t border-black/10 pt-5 text-center text-sm text-black/60";

export const AUTH_INPUT_BASE_CLASS =
    "min-h-12 w-full rounded-xl border bg-white px-3.5 text-[0.9375rem] text-black outline-none shadow-[0_4px_14px_rgba(45,23,102,0.035)] transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-black/35 hover:border-primarypurple/30 focus:border-primarypurple focus:ring-[3px] focus:ring-primarypurple/15 disabled:cursor-not-allowed disabled:bg-black/[0.04] disabled:text-black/45";

export const AUTH_PRIMARY_BUTTON_CLASS =
    "min-h-12 w-full rounded-xl bg-primarypurple px-5 text-[0.9375rem] font-semibold text-white shadow-[0_10px_28px_rgba(111,67,254,0.20)] transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-[#5d32eb] hover:shadow-[0_14px_34px_rgba(111,67,254,0.26)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple active:translate-y-px active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-primarypurple/40 disabled:opacity-100 disabled:transform-none";

export const AUTH_ACTION_LINK_CLASS =
    "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primarypurple px-5 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(111,67,254,0.20)] transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-[#5d32eb] hover:shadow-[0_14px_34px_rgba(111,67,254,0.26)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primarypurple active:translate-y-px active:scale-[0.99]";

export const getAuthInputClass = (hasError: boolean) =>
    `${AUTH_INPUT_BASE_CLASS} ${
        hasError
            ? "border-red-500 focus:border-red-500 focus:ring-red-500/15"
            : "border-black/15"
    }`;
