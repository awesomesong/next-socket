import { NextRequest, NextResponse } from "next/server";
import sha1 from 'sha1';
import { getCurrentUser } from "../../lib/session";
  
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        const formData = await req.formData();

        if(!user?.id || !user?.email) return NextResponse.json({message: '로그인이 되지 않았습니다. 로그인 후에 이용해주세요.'}, {status: 401})
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
        const preset = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_PRESET!;
        
        formData.append("upload_preset", preset);
        formData.append("cloud_name", cloudName);
        
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData,
        });

        const result = await res.json();
        
        return NextResponse.json({ url: result.secure_url , message: '이미지 업로드를 성공하였습니다.' }, { status: 200 });
    } catch (error) {
        console.error('[Cloudinary upload Error]', error);
        return NextResponse.json(
            { message: '오류가 발생하여 이미지 업로드를 실패하였습니다.' },
            { status: 500 }
        );
    }
}

const getPublicIdFromUrl = ({ url, folderName }: { url: string; folderName?: string }) => {
    const parts = url.split('/');
    const filename = parts[parts.length - 1].split('.')[0];
    const cleanFolder = folderName?.replace(/^\/+/, '');
    return cleanFolder ? `${cleanFolder}/${filename}` : filename;
};

export async function DELETE(req: NextResponse, res: NextRequest) {

    try {
        const user = await getCurrentUser();
        const body = await req.json();
        const { url, folderName } = body;

        if(!user?.id || !user?.email) return NextResponse.json({message: '로그인이 되지 않았습니다. 로그인 후에 이용해주세요.'}, {status: 401})

        const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
        const apiKey = process.env.CLOUDINARY_API_KEY!;
        const apiSecret = process.env.CLOUDINARY_API_SECRET!;

        const publicId = getPublicIdFromUrl({ url, folderName });
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const stringToSign = `public_id=${publicId}&timestamp=${timestamp}`;
        const signature = sha1(stringToSign + apiSecret);

        const formData = new URLSearchParams();
        formData.append('public_id', publicId);
        formData.append('signature', signature);
        formData.append('timestamp', timestamp);
        formData.append('api_key', apiKey);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        return NextResponse.json({ data }, {status: 200});
    } catch (error) {
        console.error('[Cloudinary Delete Error]', error);
        return NextResponse.json({message: "이미지를 삭제하지 못했습니다."})
    }
}
