DENO = deno
DENO_FLAGS = --allow-read --allow-write --allow-net --unstable
DENO_TARGET_WIN = --target x86_64-pc-windows-msvc
FILENAME = crawl.ts


all: macos win

macos:
	$(DENO) compile $(DENO_FLAGS) $(FILENAME)
	
win:
	$(DENO) compile $(DENO_FLAGS) $(DENO_TARGET_WIN) -o crawl.exe $(FILENAME)

