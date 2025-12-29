import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/Auth.css";
import "../styles/Editor.css";

import {
  EditorContent,
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  useEditor,
} from "@tiptap/react";
import { Extension } from "@tiptap/core";
import { Plugin, TextSelection } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "@tiptap/markdown";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { createLowlight } from "lowlight";
import { createPost, getImageUrl, getPost, updatePost, uploadFile } from "../api";
import Swal from "sweetalert2";
import { useAuth } from "../contexts/AuthContext";

import js from "highlight.js/lib/languages/javascript";
import ts from "highlight.js/lib/languages/typescript";
import java from "highlight.js/lib/languages/java";
import json from "highlight.js/lib/languages/json";   
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import bash from "highlight.js/lib/languages/bash";
import sql from "highlight.js/lib/languages/sql";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import csharp from "highlight.js/lib/languages/csharp";
import rust from "highlight.js/lib/languages/rust";
import ruby from "highlight.js/lib/languages/ruby";

// 마크다운(특히 ```fenced code block```)을 붙여넣었을 때 자동으로 노션식 블록으로 변환
const PasteMarkdown = Extension.create({
  name: "pasteMarkdown",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handlePaste: (_view, event) => {
            const text = event.clipboardData?.getData("text/plain");
            if (!text) return false;

            const trimmed = text.trim();
            const looksLikeFencedCodeBlock =
              /^```[a-zA-Z0-9_-]*\n[\s\S]*\n```$/.test(trimmed);

            if (!looksLikeFencedCodeBlock) return false;

            // @tiptap/markdown이 제공하는 contentType: "markdown" 파싱을 이용
            this.editor.commands.insertContent(trimmed, { contentType: "markdown" });
            return true;
          },
        },
      }),
    ];
  },
});

// 인라인 코드: `내용` 입력 시 자동으로 code 마크로 변환 (노션/마크다운 느낌)
// - StarterKit의 code mark를 사용
// - "닫는 백틱(`)"을 입력하는 순간 변환되도록 handleTextInput으로 처리
const InlineCodeBackticks = Extension.create({
  name: "inlineCodeBackticks",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleTextInput: (view, _from, _to, text) => {
            if (text !== "`") return false;

            const { state, dispatch } = view;
            const { selection, schema } = state;
            const { $from, empty } = selection;
            if (!empty) return false;

            const codeMark = schema.marks?.code;
            if (!codeMark) return false;

            // 현재 textblock(보통 paragraph) 안에서만 처리
            const blockStart = $from.start();
            const textBeforeCursor = state.doc.textBetween(blockStart, $from.pos, "\n", "\uFFFC");

            const openIdx = textBeforeCursor.lastIndexOf("`");
            if (openIdx < 0) return false;

            const inner = textBeforeCursor.slice(openIdx + 1);
            // 비어있거나 줄바꿈 포함이면 변환하지 않음
            if (!inner || inner.includes("\n")) return false;
            // 안에 백틱이 또 있으면(중첩) 변환하지 않음
            if (inner.includes("`")) return false;

            const openPos = blockStart + openIdx;

            // `inner` + (현재 입력된 닫는 백틱) 을 "code mark 적용된 inner"로 치환
            const tr = state.tr.replaceWith(
              openPos,
              $from.pos,
              schema.text(inner, [codeMark.create()])
            );
            tr.setSelection(TextSelection.create(tr.doc, openPos + inner.length));

            dispatch(tr);
            return true;
          },
        },
      }),
    ];
  },
});

// 웹에서 복사한 이미지 URL을 다운로드해서 File 객체로 변환하는 헬퍼 함수
const downloadImageAsFile = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error("Failed to fetch image");
    const blob = await response.blob();
    const fileName = imageUrl.split("/").pop() || "image.jpg";
    const file = new File([blob], fileName, { type: blob.type });
    return file;
  } catch (error) {
    console.error("Failed to download image:", error);
    return null;
  }
};

// HTML에서 이미지 URL을 추출하는 함수
const extractImageUrlFromHtml = (html) => {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (!match?.[1]) return null;
  const url = match[1].trim();
  // file:// 경로나 data: URL은 제외
  if (url.startsWith("file://") || url.startsWith("data:")) return null;
  // http:// 또는 https:// URL만 반환
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return null;
};

// Extension 내부에서 이미지 파일을 처리하는 헬퍼 함수 (Extension에서 호출 가능하도록 전역으로)
const processImageFileInExtension = async (file, editorInstance) => {
  if (!file.type.startsWith("image/")) return false;
  if (file.size > 10 * 1024 * 1024) return false;

  try {
    const uploadResponse = await uploadFile(file);
    const relativeUrl = uploadResponse.data?.data?.url;
    if (relativeUrl) {
      const absoluteUrl = getImageUrl(relativeUrl);
      editorInstance
        .chain()
        .focus()
        .setImage({ src: absoluteUrl, alt: file.name })
        .run();
      return true;
    }
  } catch {
    // fallback to dataURL
  }

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("failed to read file"));
    reader.readAsDataURL(file);
  });

  editorInstance.chain().focus().setImage({ src: String(dataUrl), alt: file.name }).run();
  return true;
};

// 코드블록 하이라이팅을 위한 lowlight 인스턴스 + 언어 등록
const lowlight = createLowlight();
lowlight.register({ javascript: js, typescript: ts, java, json, xml, css, bash, sql });
lowlight.register({ c, cpp, csharp, rust, ruby });
lowlight.registerAlias({
  javascript: ["js"],
  typescript: ["ts"],
  xml: ["html", "htm"],
  cpp: ["c++"],
  csharp: ["cs", "c#"],
});

// 노션처럼 코드블록 우측 상단에 언어 배지를 표시하는 NodeView
const CodeBlockNodeView = ({ node }) => {
  const language = node?.attrs?.language || "plain";

  return (
    <NodeViewWrapper className="codeblock-wrapper">
      <div className="codeblock-lang" title={language}>
        {language}
      </div>
      <pre className="codeblock-pre">
        <code>
          <NodeViewContent as="code" className="codeblock-content" />
        </code>
      </pre>
    </NodeViewWrapper>
  );
};

// CodeBlockLowlight + NodeView 합친 확장
const CodeBlockLowlightWithLabel = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockNodeView);
  },
});

const PostCreatePage = () => {
  // 작성 완료/취소 후 페이지 이동을 위한 라우터 네비게이션
  const navigate = useNavigate();
  const { id: postId } = useParams();
  const isEditMode = Boolean(postId);
  const { user } = useAuth();

  // 제목 입력값 상태
  const [title, setTitle] = useState("");

  // 화면에 보여줄 에러 메시지 상태
  const [error, setError] = useState("");

  // 제출/업로드 진행 중 여부 상태(버튼 비활성화 등)
  const [loading, setLoading] = useState(false);

  // 이미지 업로드 진행 중 여부
  const [imageUploading, setImageUploading] = useState(false);

  // 수정 모드에서 기존 글 불러오는 로딩
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  // 현재 에디터 내용을 Markdown으로 확인하기 위한 토글/텍스트
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [markdownPreview, setMarkdownPreview] = useState("");

  // Tiptap 내부 상태 변경 시 툴바 active 표시를 갱신하기 위한 리렌더 트리거
  const [, forceToolbarRerender] = useState(0);

  // 이미지 선택 input을 코드에서 클릭시키기 위한 ref
  const imageInputRef = useRef(null);

  // 선택한 이미지 파일을 dataURL로 읽어서 에디터에 <img>로 삽입(백엔드 붙이면 URL로 교체)
  const insertImageFromFile = async (file) => {
    if (!editor) return;

    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드 가능합니다.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("이미지 크기는 10MB 이하여야 합니다.");
      return;
    }

    // 1) 서버 업로드를 먼저 시도(성공 시 /uploads/... URL 삽입)
    try {
      setImageUploading(true);
      const uploadResponse = await uploadFile(file);
      const relativeUrl = uploadResponse.data?.data?.url;
      if (relativeUrl) {
        const absoluteUrl = getImageUrl(relativeUrl);
        editor
          .chain()
          .focus()
          .setImage({ src: absoluteUrl, alt: file.name })
          .run();
        return;
      }
    } catch {
      // ignore, fallback below
    } finally {
      setImageUploading(false);
    }

    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("failed to read file"));
      reader.readAsDataURL(file);
    });

    editor.chain().focus().setImage({ src: String(dataUrl), alt: file.name }).run();
  };

  // 붙여넣기/드래그&드롭으로 이미지 삽입을 처리하는 확장
  const PasteOrDropImage = Extension.create({
    name: "pasteOrDropImage",
    priority: 50, // 다른 확장보다 나중에 실행되도록 우선순위 설정 (낮을수록 나중)
    addProseMirrorPlugins() {
      const editorInstance = this.editor; // Extension의 editor 인스턴스를 클로저로 캡처
      const looksLikeLocalFileImagePaste = (html) => {
        if (!html) return false;
        return /<img[^>]+src=["']file:\/\//i.test(html);
      };

      return [
        new Plugin({
          props: {
            handlePaste: async (view, event) => {
              const items = event.clipboardData?.items;
              // 1) clipboardData.items에서 이미지 파일 찾기
              if (items && items.length) {
                for (const item of items) {
                  if (item.kind === "file" && item.type?.startsWith("image/")) {
                    const file = item.getAsFile();
                    if (file && editorInstance) {
                      event.preventDefault();
                      await processImageFileInExtension(file, editorInstance);
                      return true;
                    }
                  }
                }
              }

              // 2) HTML에서 웹 이미지 URL 추출 및 처리 (이미지가 실제로 있을 때만 처리)
              const html = event.clipboardData?.getData("text/html");
              const plainText = event.clipboardData?.getData("text/plain");
              
              // HTML이 있는 경우
              if (html) {
                // 로컬 파일 경로(file://)는 경고만 표시
                if (looksLikeLocalFileImagePaste(html)) {
                  event.preventDefault();
                  Swal.fire({
                    icon: "warning",
                    title: "로컬 이미지 경로 감지",
                    text: "로컬 이미지가 '파일 경로(file://...)'만 복사되어 붙여넣기 시 브라우저가 접근할 수 없어 엑박이 날 수 있어요.\n\n해결: 이미지 버튼으로 파일 선택하거나, 이미지 파일을 드래그&드롭해 주세요.",
                    confirmButtonText: "확인",
                  });
                  return true;
                }

                // HTML에 <img> 태그가 있는지 먼저 확인
                const hasImageTag = /<img[^>]+>/i.test(html);
                if (hasImageTag && editorInstance) {
                  event.preventDefault();
                  // 웹 이미지 URL 추출 및 다운로드 시도
                  const imageUrl = extractImageUrlFromHtml(html);
                  if (imageUrl) {
                    try {
                      const file = await downloadImageAsFile(imageUrl);
                      if (file) {
                        // 이미지 다운로드 성공 시 서버 업로드
                        const uploadResponse = await uploadFile(file);
                        const relativeUrl = uploadResponse.data?.data?.url;
                        if (relativeUrl) {
                          const absoluteUrl = getImageUrl(relativeUrl);
                          // HTML에서 첫 번째 이미지 태그의 src만 서버 URL로 교체 (정확한 매칭)
                          const htmlWithServerImage = html.replace(
                            /(<img[^>]+src=["'])([^"']+)(["'][^>]*>)/i,
                            (match, before, src, after) => {
                              // src가 추출한 imageUrl과 일치하거나 포함하는지 확인
                              const srcTrimmed = src.trim();
                              if (srcTrimmed === imageUrl || srcTrimmed.includes(imageUrl.split('?')[0])) {
                                return `${before}${absoluteUrl}${after}`;
                              }
                              return match; // 일치하지 않으면 원본 유지
                            }
                          );
                          // 교체된 HTML 전체를 한 번에 삽입 (이미지와 텍스트가 올바른 순서로, 중복 없이)
                          editorInstance.commands.insertContent(htmlWithServerImage, { contentType: "html" });
                          return true;
                        }
                      }
                    } catch (error) {
                      console.error("Failed to download/upload image:", error);
                      // 이미지 다운로드/업로드 실패 시 원본 HTML 그대로 삽입
                    }
                  }
                  // 이미지 URL 추출 실패 또는 다운로드 실패 시 원본 HTML 그대로 삽입
                  editorInstance.commands.insertContent(html, { contentType: "html" });
                  return true;
                }
                
                // HTML을 직접 삽입 (이미지가 없는 경우)
                // 다른 블로그에서 복사한 텍스트 처리
                if (editorInstance && html.trim()) {
                  event.preventDefault();
                  // Tiptap의 insertContent를 사용하여 HTML 삽입 (contentType: "html" 명시)
                  editorInstance.commands.insertContent(html, { contentType: "html" });
                  return true;
                }
              }

              // 이미지 파일도 없고, HTML도 없으면 기본 붙여넣기 동작 허용
              // false를 반환하면 Tiptap의 기본 텍스트 붙여넣기가 작동함
              return false;
            },
          },
        }),
      ];
    },
  });

  // Tiptap 에디터: 노션처럼 한 화면에서 즉시 서식 적용 (StarterKit input rule 기반)
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // 코드블록은 Lowlight 버전으로 대체(문법 하이라이트 + 언어 표시)
        codeBlock: false,
      }),
      CodeBlockLowlightWithLabel.configure({ lowlight }),
      Image,
      Placeholder.configure({
        placeholder:
          "내용을 입력하세요.",
      }),
      // Markdown 저장/로드를 위한 확장 (editor.getMarkdown() 제공) - HTML 붙여넣기 처리
      Markdown,
      PasteMarkdown,
      InlineCodeBackticks,
      PasteOrDropImage, // 이미지 처리는 마지막에
    ],
    content: "",
    // 코드처럼 보이는 텍스트에 브라우저 spellcheck가 빨간 밑줄을 그어버리는 문제 방지
    editorProps: {
      attributes: {
        spellcheck: "false",
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
      },
    },
  });

  // 수정 모드: 기존 게시글을 불러와서 제목/본문을 세팅
  useEffect(() => {
    if (!isEditMode) {
      setInitialLoading(false);
      return;
    }
    if (!editor) return;

    let cancelled = false;

    const load = async () => {
      try {
        setInitialLoading(true);
        setError("");

        const res = await getPost(postId);
        const data = res?.data?.data;
        if (!data) {
          throw new Error("post not found");
        }

        // 본인 글만 수정 가능 (프론트에서도 1차 가드)
        const authorId = data?.author?.id;
        if (user?.id && authorId && user.id !== authorId) {
          await Swal.fire({
            icon: "warning",
            title: "권한 없음",
            text: "본인 게시물만 수정할 수 있습니다.",
            confirmButtonText: "확인",
          });
          navigate(`/posts/${postId}`);
          return;
        }

        setTitle(data.title || "");
        editor.commands.setContent(data.content || "", { contentType: "markdown" });
      } catch (e) {
        if (!cancelled) {
          await Swal.fire({
            icon: "error",
            title: "불러오기 실패",
            text: "게시글을 불러오지 못했습니다.",
            confirmButtonText: "확인",
          });
          navigate(-1);
        }
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [isEditMode, editor, postId, user?.id, navigate]);

  // 에디터 상태 변경(커서 이동/토글 등) 시 React가 리렌더되지 않는 문제를 보정
  useEffect(() => {
    if (!editor) return;

    const rerender = () => forceToolbarRerender((x) => x + 1);
    editor.on("selectionUpdate", rerender);
    editor.on("transaction", rerender);

    return () => {
      editor.off("selectionUpdate", rerender);
      editor.off("transaction", rerender);
    };
  }, [editor]);

  // 제목 변경 시 상태 업데이트 + 에러 초기화
  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setError("");
  };

  // 제목 input에서 Tab을 누르면 본문(에디터)로 포커스 이동
  const handleTitleKeyDown = (e) => {
    // Shift+Tab은 기본 동작(이전 포커스) 유지
    if (e.key !== "Tab" || e.shiftKey) return;
    if (!editor) return;

    e.preventDefault();
    editor.commands.focus();
  };

  // 툴바 버튼 active 판정: 현재 선택/커서 위치 + storedMarks(다음 입력에 적용될 마크)까지 포함
  const isMarkActive = (markName) => {
    if (!editor) return false;
    if (editor.isActive(markName)) return true;

    const stored = editor.state?.storedMarks;
    if (stored?.some((m) => m.type?.name === markName)) return true;

    const cursorMarks = editor.state?.selection?.$from?.marks?.();
    if (cursorMarks?.some((m) => m.type?.name === markName)) return true;

    return false;
  };

  // 에디터 특정 좌표에 커서를 옮기기(드롭한 위치로 정확히 삽입하기 위함)
  const setSelectionAtCoords = (clientX, clientY) => {
    if (!editor?.view) return null;
    const pos = editor.view.posAtCoords({ left: clientX, top: clientY });
    if (!pos?.pos) return null;
    editor.commands.setTextSelection(pos.pos);
    return pos.pos;
  };

  // 에디터 영역에 파일을 드롭했을 때: 브라우저 기본 동작(파일 열기) 막고, 드롭 위치에 이미지 삽입
  const handleDropOnEditorSurface = async (e) => {
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter((f) => f.type?.startsWith("image/"));
    if (imageFiles.length === 0) return;

    e.preventDefault();
    e.stopPropagation();

    const droppedPos = setSelectionAtCoords(e.clientX, e.clientY);

    for (const file of imageFiles) {
      if (droppedPos) {
        editor.commands.setTextSelection(droppedPos);
      }
      await insertImageFromFile(file);
    }
  };

  // 이미지 버튼 클릭 시 파일 선택창 열기
  const handleClickImageButton = () => {
    setError("");
    imageInputRef.current?.click();
  };

  // 파일 선택 시 이미지 삽입
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await insertImageFromFile(file);
    // 같은 파일을 다시 선택할 수 있게 value 초기화
    e.target.value = "";
  };

  // 마크다운에서 첫 번째 이미지 URL(썸네일용)을 추출
  const extractFirstImageUrl = (markdown) => {
    const match = markdown.match(/!\[[^\]]*]\(([^)]+)\)/);
    if (!match?.[1]) return null;
    const url = match[1].trim();
    if (!url || url.startsWith("data:")) return null;
    return url;
  };

  // 출간/수정: 제목 + markdown을 백엔드로 전송
  const handlePublish = async () => {
    if (!editor) return;
    if (initialLoading) return;
    setError("");
    setLoading(true);

    try {
      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        setError("제목을 입력해주세요.");
        return;
      }

      const markdown = editor.getMarkdown().trim();
      if (!markdown) {
        setError("내용을 입력해주세요.");
        return;
      }

      // 업로드 실패 fallback으로 data:image/...가 본문에 들어가면 엄청 길어져서 서버 검증에 걸릴 수 있음
      if (/!\[[^\]]*]\(data:image\/[^)]+\)/i.test(markdown) || markdown.includes("data:image/")) {
        setError(
          "본문에 base64(data:image/...) 이미지가 포함되어 있어요. 서버 업로드가 아닌 임시 데이터라 출간 시 용량 제한에 걸립니다. 이미지가 정상 업로드(/uploads/...) 되도록 다시 추가해 주세요."
        );
        return;
      }

      // 백엔드 PostCreateRequest.content 제한과 동일하게 제한(현재 2,000,000자)
      const MAX_CONTENT = 2_000_000;
      if (markdown.length > MAX_CONTENT) {
        setError(`내용이 너무 깁니다. (${markdown.length.toLocaleString()}자 / 최대 ${MAX_CONTENT.toLocaleString()}자)`);
        return;
      }

      const imageUrl = extractFirstImageUrl(markdown);

      if (isEditMode) {
        await updatePost(postId, {
          title: trimmedTitle,
          content: markdown,
          imageUrl,
        });
        await Swal.fire({
          icon: "success",
          title: "수정 완료!",
          text: "게시글이 성공적으로 수정되었습니다.",
          confirmButtonText: "확인",
        });
        navigate(`/posts/${postId}`);
      } else {
        const res = await createPost({
          title: trimmedTitle,
          content: markdown, // DB에는 markdown string 저장
          imageUrl,
        });
        const createdId = res?.data?.data?.id;
        await Swal.fire({
          icon: "success",
          title: "출간 완료!",
          text: "게시글이 성공적으로 출간되었습니다.",
          confirmButtonText: "확인",
        });
        navigate(createdId ? `/posts/${createdId}` : "/");
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || "출간에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 현재 내용을 Markdown으로 뽑아서 화면에 표시(이미지가 URL로 들어갔으면 여기에도 URL이 보임)
  const handleToggleMarkdown = () => {
    if (!editor) return;
    const next = !showMarkdown;
    setShowMarkdown(next);
    if (next) {
      setMarkdownPreview(editor.getMarkdown());
    }
  };

  // 현재 Markdown을 클립보드에 복사
  const handleCopyMarkdown = async () => {
    if (!editor) return;
    const md = editor.getMarkdown();
    await navigator.clipboard.writeText(md);
    setMarkdownPreview(md);
    setShowMarkdown(true);
    Swal.fire({
      icon: "success",
      title: "복사 완료!",
      text: "Markdown을 클립보드에 복사했어요!",
      confirmButtonText: "확인",
      timer: 2000,
      timerProgressBar: true,
    });
  };

  return (
    <div
      className="auth-container post-create-page"
      onDragOver={(e) => {
        // 파일 드래그 시 브라우저의 기본 동작(파일 열기)을 페이지 레벨에서 차단
        if (e.dataTransfer?.types?.includes("Files")) {
          e.preventDefault();
        }
      }}
      onDrop={(e) => {
        // 에디터 바깥에 떨어뜨려도 새 탭/페이지 이동으로 파일이 열리지 않게 차단
        if (e.dataTransfer?.files?.length) {
          e.preventDefault();
        }
      }}
    >
      <div className={`post-create-shell ${showMarkdown ? "with-markdown" : ""}`}>
        <div className="auth-box post-create-left" style={{ maxWidth: "1200px" }}>
          <div className="auth-form">
            <input
              type="text"
              placeholder="제목을 입력하세요."
              value={title}
              onChange={handleTitleChange}
              onKeyDown={handleTitleKeyDown}
              className="post-title-input"
            />

            {/* 간단 툴바 (노션식 편집 + 단축키 보조) */}
            <div className="editor-toolbar">
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                disabled={!editor}
                className={isMarkActive("bold") ? "active" : ""}
                aria-pressed={isMarkActive("bold")}
              >
                Bold
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                disabled={!editor}
                className={isMarkActive("italic") ? "active" : ""}
                aria-pressed={isMarkActive("italic")}
              >
                Italic
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleStrike().run()}
                disabled={!editor}
                className={isMarkActive("strike") ? "active" : ""}
                aria-pressed={isMarkActive("strike")}
              >
                Strike
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleCode().run()}
                disabled={!editor}
                className={isMarkActive("code") ? "active" : ""}
                aria-pressed={isMarkActive("code")}
                title="인라인 코드 (또는 `내용` 입력)"
              >
                Code
              </button>
              <span className="editor-divider" aria-hidden="true" />
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                disabled={!editor}
                className={editor?.isActive("bulletList") ? "active" : ""}
              >
                • List
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                disabled={!editor}
                className={editor?.isActive("orderedList") ? "active" : ""}
              >
                1. List
              </button>
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                disabled={!editor}
                className={editor?.isActive("blockquote") ? "active" : ""}
              >
                Quote
              </button>
              <span className="editor-divider" aria-hidden="true" />
              <button
                type="button"
                onClick={handleClickImageButton}
                disabled={!editor || imageUploading}
              >
                {imageUploading ? "업로드 중..." : "이미지 첨부"}
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
            </div>

            {/* 노션처럼: 미리보기 없이 한 화면에서 즉시 서식 적용 */}
            <div
              className="editor-surface"
              onMouseDown={(e) => {
                if (!editor?.view) return;

                // ProseMirror 내부를 클릭한 경우는 기본 동작(커서 이동/드래그 선택)을 그대로 둠
                const inEditor = e.target?.closest?.(".ProseMirror");
                if (inEditor) return;

                // 바깥 빈 영역 클릭 시에도 커서가 들어가게 처리
                e.preventDefault();
                editor.commands.focus();

                const pos = editor.view.posAtCoords({
                  left: e.clientX,
                  top: e.clientY,
                });
                if (pos?.pos) {
                  editor.commands.setTextSelection(pos.pos);
                }
              }}
              onDragOver={(e) => {
                if (e.dataTransfer?.types?.includes("Files")) {
                  e.preventDefault();
                }
              }}
              onDrop={(e) => {
                void handleDropOnEditorSurface(e);
              }}
            >
              <EditorContent editor={editor} />
            </div>

            {error && <p className="error-message">{error}</p>}

            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={loading || initialLoading || !editor}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (isEditMode ? "수정 중..." : "출간 중...") : (isEditMode ? "수정하기" : "출간하기")}
              </button>
              <button
                type="button"
                onClick={handleToggleMarkdown}
                disabled={!editor}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: "#111",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: !editor ? "not-allowed" : "pointer",
                  opacity: !editor ? 0.7 : 1,
                }}
              >
                {showMarkdown ? "Markdown 닫기" : "Markdown 보기"}
              </button>
            </div>

            <div className="editor-hint">
              팁: <b>#</b> + 스페이스 → 제목, <b>-</b> + 스페이스 → 리스트, <b>&gt;</b> + 스페이스 → 인용
            </div>
          </div>
        </div>

        {showMarkdown && (
          <div className="markdown-preview post-create-right">
            <div className="markdown-preview-header">
              <div className="markdown-preview-title">현재 Markdown</div>
              <button type="button" onClick={handleCopyMarkdown}>
                복사
              </button>
            </div>
            <textarea readOnly value={markdownPreview} />
            <div className="markdown-preview-hint">
              이미지가 서버 업로드로 들어갔다면 여기서 <code>![](...)</code>의 URL이{" "}
              <code>/uploads/...</code> 형태로 보입니다. (fallback이면{" "}
              <code>data:image/...</code>)
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCreatePage;


