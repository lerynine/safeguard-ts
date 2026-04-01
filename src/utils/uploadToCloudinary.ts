export const uploadToCloudinary = async (file: string | Blob) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "safeguard");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/ddzvtlrwg/image/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();
  return data.secure_url;
};