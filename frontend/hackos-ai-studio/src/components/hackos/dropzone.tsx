import { useDropzone, type Accept } from "react-dropzone";
import { motion } from "framer-motion";
import { UploadCloud, FileText } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function AiDropzone({
  accept,
  hint,
  onFile,
}: {
  accept?: Accept;
  hint: string;
  onFile: (file: File) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    multiple: false,
    onDrop: (files) => {
      if (files[0]) {
        setFile(files[0]);
        onFile(files[0]);
      }
    },
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "glass relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-white/10 p-10 text-center transition",
        isDragActive && "border-brand ring-brand",
      )}
    >
      <input {...getInputProps()} />
      <motion.div
        animate={{ scale: isDragActive ? 1.05 : 1 }}
        className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-brand-soft"
      >
        {file ? <FileText className="h-7 w-7" /> : <UploadCloud className="h-7 w-7" />}
      </motion.div>
      <div className="mt-4 text-base font-medium">
        {file ? file.name : isDragActive ? "Drop it here" : "Drag & drop or click to upload"}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}
