import toast from "react-hot-toast";

export interface UpdateProfileRequest {
  image: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  image: string;
  message?: string;
}

export const updateProfile = async (data: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
  try {
    const response = await fetch(`/api/settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Profile update error:", error);
    throw new Error("프로필 수정 중 오류가 발생했습니다.");
  }
};
