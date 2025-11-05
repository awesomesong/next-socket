export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}

export const registerUser = async (data: RegisterRequest): Promise<RegisterResponse> => {
  const response = await fetch(`/api/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error('회원가입 중 오류가 발생했습니다.');
  }

  return result;
};
