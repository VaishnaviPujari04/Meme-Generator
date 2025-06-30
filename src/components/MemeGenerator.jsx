import React, { useState, useRef, useEffect } from "react";
import {
  Download,
  Search,
  Image as ImageIcon,
  TextSelect,
  XCircle,
  Eraser,
  RotateCw,
  Pencil,
  Trash2,
} from "lucide-react";
import { Rnd } from "react-rnd";
import html2canvas from "html2canvas";

function MemeGenerator() {
  const [memeImage, setMemeImage] = useState(null);
  const [textBoxes, setTextBoxes] = useState([
    { id: 1, text: "", color: "#FFFFFF" },
    { id: 2, text: "", color: "#FFFFFF" },
    { id: 3, text: "", color: "#FFFFFF" },
  ]);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templates, setTemplates] = useState([]);
  const [rotation, setRotation] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [myTemplates, setMyTemplates] = useState([]);
  const [downloadFormat, setDownloadFormat] = useState("png");
  const [isErasing, setIsErasing] = useState(false);

  const memeRef = useRef(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  // Fetch meme templates
  useEffect(() => {
    fetch("https://api.imgflip.com/get_memes")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) setTemplates(data.data.memes);
      });
  }, []);

  // Drawing setup
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineWidth = 4;

    // Set composite operation based on erase mode
    ctx.globalCompositeOperation = isErasing
      ? "destination-out"
      : "source-over";
    ctx.strokeStyle = isErasing ? "rgba(0,0,0,1)" : "#000";

    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctxRef.current = ctx;
    canvas.isDrawing = true;
  };

  const draw = (e) => {
    const canvas = canvasRef.current;
    if (!canvas.isDrawing) return;
    const ctx = ctxRef.current;
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    canvasRef.current.isDrawing = false;
  };

  const handleMediaUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const isVideo = file.type.startsWith("video/");
        setMemeImage(reader.result);
        setMyTemplates((prev) => [
          ...prev,
          {
            id: Date.now(),
            url: reader.result,
            type: isVideo ? "video" : "image",
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadMeme = async () => {
    if (!memeImage) return;
    if (memeRef.current) {
      const canvas = await html2canvas(memeRef.current, { useCORS: true });
      const link = document.createElement("a");
      link.download = `my-meme.${downloadFormat}`;
      link.href = canvas.toDataURL(`image/${downloadFormat}`);
      link.click();
    }
  };

  const handleReset = () => {
    setMemeImage(null);
    setTextBoxes([
      { id: 1, text: "", color: "#FFFFFF" },
      { id: 2, text: "", color: "#FFFFFF" },
      { id: 3, text: "", color: "#FFFFFF" },
    ]);
    setTemplateSearch("");
    setRotation(0);
    setIsDrawing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const rotateImage = () => {
    setRotation((prev) => prev + 90);
  };

  const removeTextBox = (id) => {
    setTextBoxes(textBoxes.map((t) => (t.id === id ? { ...t, text: "" } : t)));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 w-full max-w-7xl mx-auto bg-gray-100 rounded-lg shadow-xl">
      {/* Meme Preview */}
      <div className="flex-1 min-w-[300px] bg-white rounded-lg p-4 shadow-md flex flex-col items-center justify-center border relative overflow-hidden">
        {/* Tools */}
        <div className="absolute top-2 left-2 flex gap-2 z-10">
          <button
            onClick={rotateImage}
            className="flex items-center px-2 py-1 bg-gray-800 text-white text-xs rounded hover:bg-gray-900"
          >
            <RotateCw className="w-4 h-4 mr-1" /> Rotate
          </button>
          <button
            onClick={() => {
              setIsDrawing(true);
              setIsErasing(false);
            }}
            className={`flex items-center px-2 py-1 text-xs rounded ${
              isDrawing && !isErasing
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-white hover:bg-gray-900"
            }`}
          >
            <Pencil className="w-4 h-4 mr-1" /> Draw
          </button>

          <button
            onClick={() => {
              setIsDrawing(true);
              setIsErasing(true);
            }}
            className={`flex items-center px-2 py-1 text-xs rounded ${
              isDrawing && isErasing
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-white hover:bg-gray-900"
            }`}
          >
            <Eraser className="w-4 h-4 mr-1" /> Erase
          </button>
        </div>

        <div
          ref={memeRef}
          className="relative w-full aspect-[4/3] bg-gray-200 flex items-center justify-center border rounded-lg overflow-hidden"
          style={{ maxWidth: "600px" }}
        >
          {memeImage ? (
            memeImage.startsWith("data:video") ? (
              <video
                src={memeImage}
                controls
                className="w-full h-full object-contain"
                style={{ transform: `rotate(${rotation}deg)` }}
              />
            ) : (
              <img
                src={memeImage}
                alt="Meme"
                style={{ transform: `rotate(${rotation}deg)` }}
                className="w-full h-full object-contain"
              />
            )
          ) : (
            <div className="text-gray-500 flex flex-col items-center justify-center h-full">
              Upload or select image/video
            </div>
          )}

          {textBoxes.map((box) =>
            box.text ? (
              <Rnd
                key={box.id}
                default={{
                  x: 50,
                  y: 50,
                  width: 200,
                  height: 50,
                }}
                bounds="parent"
                enableResizing
              >
                <div
                  style={{
                    color: box.color,
                    WebkitTextStroke: "2px black",
                    fontSize: "22px",
                    fontWeight: "bold",
                    textAlign: "center",
                    wordBreak: "break-word",
                  }}
                >
                  {box.text}
                </div>
              </Rnd>
            ) : null
          )}

          {/* Drawing Canvas */}
          {isDrawing && (
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
              width={600}
              height={450}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="flex-1 bg-white rounded-lg p-4 shadow-md border flex flex-col gap-4">
        <div className="flex gap-3">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleMediaUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex-grow"
          >
            <ImageIcon className="w-5 h-5 mr-2" /> Upload new template
          </button>

          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search memes"
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              className="pl-8 pr-4 py-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
        </div>
        {myTemplates.length > 0 && (
          <div className="mt-2">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-md font-semibold text-gray-800">
                My Templates
              </h2>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 overflow-y-auto max-h-48 p-2 border rounded bg-gray-50">
              {myTemplates.map((template) => (
                <div
                  key={template.id}
                  className="relative flex flex-col items-center"
                >
                  {/* Delete button */}
                  <button
                    onClick={() =>
                      setMyTemplates(
                        myTemplates.filter((t) => t.id !== template.id)
                      )
                    }
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>

                  {/* Image */}
                  <img
                    src={template.url}
                    alt="My Meme"
                    className="w-full h-auto rounded cursor-pointer border-2 border-transparent hover:border-blue-500 object-cover aspect-[4/3]"
                    onClick={() => setMemeImage(template.url)}
                  />

                  <span className="text-xs text-gray-600 mt-1 text-center line-clamp-1 w-[80px]">
                    My Upload
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-2">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-md font-semibold text-gray-800">
              Popular Memes
            </h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 overflow-y-auto max-h-48 p-2 border rounded bg-gray-50">
            {templates
              .filter((t) =>
                t.name.toLowerCase().includes(templateSearch.toLowerCase())
              )
              .slice(0, 20)
              .map((template) => (
                <div key={template.id} className="flex flex-col items-center">
                  <img
                    src={template.url}
                    alt={template.name}
                    className="w-full h-auto rounded cursor-pointer border-2 border-transparent hover:border-blue-500 object-cover aspect-[4/3]"
                    onClick={() => setMemeImage(template.url)}
                  />
                  <span className="text-xs text-gray-600 mt-1 text-center line-clamp-1 w-[80px]">
                    {template.name}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Text fields */}
        {textBoxes.map((box, index) => (
          <div
            key={box.id}
            className="flex items-center gap-2 bg-gray-50 p-2 rounded border"
          >
            <TextSelect className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder={`Text #${index + 1}`}
              value={box.text}
              onChange={(e) =>
                setTextBoxes(
                  textBoxes.map((t) =>
                    t.id === box.id ? { ...t, text: e.target.value } : t
                  )
                )
              }
              className="flex-grow px-2 py-1 border rounded"
            />
            <input
              type="color"
              value={box.color}
              onChange={(e) =>
                setTextBoxes(
                  textBoxes.map((t) =>
                    t.id === box.id ? { ...t, color: e.target.value } : t
                  )
                )
              }
              className="w-8 h-8"
            />
            <button onClick={() => removeTextBox(box.id)}>
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        ))}

        <div className="flex flex-wrap sm:flex-nowrap gap-2">
          <div className="flex gap-2">
            <button
              onClick={handleDownloadMeme}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2 w-full md:w-auto"
            >
              <Download className="w-4 h-4" /> Download Meme
            </button>

            <select
              value={downloadFormat}
              onChange={(e) => setDownloadFormat(e.target.value)}
              className="border rounded px-2 py-2"
            >
              <option value="png">PNG</option>
              <option value="jpeg">JPG</option>
              <option value="gif">GIF</option>
              <option value="mp3">MP3</option>
            </select>
          </div>

          <button
            onClick={handleReset}
            className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 w-full sm:w-auto"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

export default MemeGenerator;
