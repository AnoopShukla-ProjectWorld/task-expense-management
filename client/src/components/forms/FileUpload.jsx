import {
  useDropzone,
} from "react-dropzone";

function FileUpload({
  onDrop,
}) {
  const { getRootProps, getInputProps } =
    useDropzone({
      onDrop,
    });

  return (
    <div
      {...getRootProps()}
      className="
        border-2 border-dashed
        border-gray-300 rounded-2xl
        p-10 text-center
        cursor-pointer bg-white
      "
    >
      <input
        {...getInputProps()}
      />

      <p>
        Drag & drop files here
      </p>
    </div>
  );
}

export default FileUpload;