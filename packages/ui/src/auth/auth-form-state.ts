export type AuthFormState = {
  ok: boolean;
  message: string;
};

export const EMPTY_AUTH_FORM_STATE: AuthFormState = Object.freeze({
  ok: false,
  message: "",
});
