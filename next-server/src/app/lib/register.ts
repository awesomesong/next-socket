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

  // ✅ JSON 파싱 시도, 실패 시 에러 처리
  let result: RegisterResponse;
  try {
    result = await response.json();
  } catch {
    // JSON 파싱 실패 시 사용자 친화적인 에러 메시지 반환
    if (!response.ok) {
      throw new Error('서버와 통신 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
    // response.ok가 true인데 JSON 파싱이 실패한 경우도 에러
    throw new Error('서버 응답을 받을 수 없습니다. 잠시 후 다시 시도해주세요.');
  }

  if (!response.ok) {
    // ✅ API에서 받은 에러 메시지를 사용, 없으면 기본 메시지
    const errorMessage = result?.message || '회원가입 중 오류가 발생했습니다.';
    throw new Error(errorMessage);
  }

  return result;
};
