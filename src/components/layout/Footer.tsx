export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">
              M
            </div>
            MathPath
          </div>
          <p>고등학생 맞춤형 수학 문제집 가이드</p>
          <p className="text-xs">
            &copy; {new Date().getFullYear()} MathPath. 교재 정보는 참고용이며, 실제 구매 전 확인을 권장합니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
