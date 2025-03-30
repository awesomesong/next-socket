import prisma from '../../../../prisma/db';
import { NextResponse } from "next/server";
import path from "path";
import fs, { writeFile, stat } from "fs/promises";

export const config = {
    api: {
      bodyParser: false
    }
}

export async function POST(req: Request){
    const data = await req.formData();
    const files = data.getAll("files") as File[];
    const filesId = data.get("filesId") as string;

    if (!files) {
        return NextResponse.json({ error: "No files received." }, { status: 400 });
    }

    for (const file of files) {
        await saveFile(file, filesId);
    }
    return NextResponse.json({message : "파일이 업로드 되었습니다.", status: 200});
}

const saveFile = async(file : File, filesId: string) => {
    const buffer: any = Buffer.from(await file.arrayBuffer());
    const filename =  file.name.replaceAll(" ", "_");
    const relativeUploadDir = `/uploads/${new Date(Date.now())
        .toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        })
        .replace(/\//g, "-")}`;
    const uploadDir = path.join(process.cwd(), `public/uploads/${filesId}/`);
    const filePath = path.join(uploadDir + filename);
    const fileUrl = `/uploads/${filesId}/${filename}`;

    try {
        // await fs.rm(uploadDir, { recursive: true });
        await fs.stat(uploadDir);
    } catch (e: any) {
        if (e.code === "ENOENT") {
            // This is for checking the directory is exist (ENOENT : Error No Entry)
            await fs.mkdir(uploadDir, { recursive: true });
        } else {
        return NextResponse.json(
            { message: "Something went wrong." },
            { status: 500 }
        );
        }
    }

    try {
        await writeFile(
            filePath,
            buffer
        );

        // Save to database
        const newFiles = await prisma.files.create({
            data: {
                filesId: filesId,
                name: filename,
                file: fileUrl,
            },
        });

        return;
    } catch(error) {
        return NextResponse.json({message: '업로드 중에 오류가 발생하였습니다. 다시 시도해주세요.'}, { status: 500 });
    }
}

export async function DELETE(
    req: Request
){
    try {
        const { ids } = await req.json();
        
        for (const id of ids) {
            const absolutePath = path.join(process.cwd(), `public/uploads/${id}`);
            try {
                await fs.stat(absolutePath);
            } catch (e: any) {
                if (e.code === "ENOENT") {
                    return NextResponse.json({ message: "삭제할 파일이 없습니다." }, { status: 500});
                } else {
                return NextResponse.json(
                        { message: "Something went wrong." },
                        { status: 500 }
                    );
                }
            }
            await fs.rm(absolutePath, { recursive: true });
        }

        return NextResponse.json({message: '파일을 삭제하였습니다.'}, { status: 200 });
    } catch(error) {
        return NextResponse.json({message: '해당 글의 파일을 삭제하지 못했습니다.'}, { status: 500 });
    }
}