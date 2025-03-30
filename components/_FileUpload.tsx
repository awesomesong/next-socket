import { BASE_URL } from "@/config";
import { useRef, useState, ChangeEvent } from "react";

const FileUpload = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewURL, setPreviewURL] = useState<string[]>([]);
  const [formData, setFormData] = useState<any>({}); // ✅ 이 부분 추가됨

  const handleChangeFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const { files, name } = e.target;

    if (e.target.files !== null && files) {
        const fileLength = Object.keys(files).length;
        Object.keys(files).forEach((i: any) => {
            const file = files[i];
            const reader = new FileReader();
            reader.readAsDataURL(file); 
            // 파일을 불러오는 메서드, 종료되는 시점에 readyState는 Done(2)이 되고 onLoad 시작
            reader.onload = (e: any) => {
              //server call for uploading or reading the files one-by-one
              //by using 'reader.result' or 'file'
              if(reader.readyState === 2) {
                    // 파일 onLoad가 성공하면 2, 진행 중은 1, 실패는 0 반환
                    setPreviewURL((prevState) => ([...prevState, e.target.result]));
                    if(i == fileLength - 1) {
                        setFormData((prevState: any) => ({
                            ...prevState,
                            [name]: files
                        }));
                    }
                }
            }
        });
        // 이미지 화면에 띄우기
        // const reader = new FileReader();
        // // // 파일을 불러오는 메서드, 종료되는 시점에 readyState는 Done(2)이 되고 onLoad 시작
        // reader.onload = (e: any) => {
        //     if(reader.readyState === 2) {
        //         // 파일 onLoad가 성공하면 2, 진행 중은 1, 실패는 0 반환
        //         setPreviewURL(e.target.result);
        //         setFormData((prevState) => ({
        //             ...prevState,
        //             [name]: files
        //         }));
        //     }
        // }
        // reader.readAsDataURL(files?.[0]);
    }
  }

  const uploadFiles = async (id : string) => {
      const formFilesData = new FormData();
      // formFilesData.append(`files`, formData.files);
      Object.values(formData.files).map((file : any, i )  => {
          formFilesData.append(`files`, file)
      });
      formFilesData.append("filesId", id); 
      try { 
          const res = await fetch(`${BASE_URL}/api/upload`, { 
              method: 'POST', body: formFilesData, 
          }); 
          const data = res.json();
      } catch(error){ 
          console.log(error);
      } 
  }; 

  return (
    <>
      <label 
        htmlFor="file"
        className='bg-transparent border text-white p-2 rounded-lg break-all'
      >
        <span 
            tabIndex={0}
            onKeyDown={(e: React.KeyboardEvent<HTMLSpanElement>) => {if(e.key === "Enter") fileRef.current?.click()}}
        >
            첨부파일
        </span>
        <span>
            {/* { formData.files && formData?.files?.map((files : FormPostFilesData) => files.name) } */}
            {formData?.files && Object.values(formData.files).map((file : any) => file.name)}
        </span>
      </label>
      <input 
          multiple
          ref={fileRef}
          id='file'
          name="files"
          onChange={handleChangeFiles}
          type="file"
          placeholder='Enter file'
          className='hidden'
      />
    </>
  )
}

export default FileUpload
