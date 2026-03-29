"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LevelBadge } from "./LevelBadge";
import { BookTypeBadge } from "./BookTypeBadge";
import {
  Workbook,
  DifficultyLevel,
} from "@/data/types";
import { getPublisherById } from "@/lib/api";

interface WorkbookCompareProps {
  workbooks: Workbook[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CompareRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <tr className="border-b last:border-b-0">
      <td className="py-2.5 pr-3 text-xs font-medium text-muted-foreground whitespace-nowrap align-top w-20">
        {label}
      </td>
      {children}
    </tr>
  );
}

export function WorkbookCompare({
  workbooks,
  open,
  onOpenChange,
}: WorkbookCompareProps) {
  if (workbooks.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>문제집 비교</DialogTitle>
          <DialogDescription>
            선택한 {workbooks.length}개의 문제집을 비교합니다
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="w-20" />
                {workbooks.map((wb) => (
                  <th
                    key={wb.id}
                    className="py-2 px-2 text-left font-semibold text-sm min-w-[140px]"
                  >
                    {wb.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <CompareRow label="출판사">
                {workbooks.map((wb) => {
                  const publisher = getPublisherById(wb.publisherId);
                  return (
                    <td key={wb.id} className="py-2.5 px-2 align-top">
                      {publisher?.name || "-"}
                    </td>
                  );
                })}
              </CompareRow>

              <CompareRow label="난이도">
                {workbooks.map((wb) => (
                  <td key={wb.id} className="py-2.5 px-2 align-top">
                    <LevelBadge
                      level={wb.difficultyLevel as DifficultyLevel}
                      size="sm"
                    />
                  </td>
                ))}
              </CompareRow>

              <CompareRow label="유형">
                {workbooks.map((wb) => (
                  <td key={wb.id} className="py-2.5 px-2 align-top">
                    <BookTypeBadge bookType={wb.bookType} />
                  </td>
                ))}
              </CompareRow>

              <CompareRow label="문제 수">
                {workbooks.map((wb) => (
                  <td key={wb.id} className="py-2.5 px-2 align-top">
                    {wb.problemCount
                      ? `${wb.problemCount.toLocaleString()}문제`
                      : "-"}
                  </td>
                ))}
              </CompareRow>

              <CompareRow label="장점">
                {workbooks.map((wb) => (
                  <td key={wb.id} className="py-2.5 px-2 align-top">
                    {wb.pros.length > 0 ? (
                      <ul className="space-y-1">
                        {wb.pros.map((pro, i) => (
                          <li key={i} className="text-xs leading-relaxed">
                            <span className="text-emerald-500 mr-1">+</span>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "-"
                    )}
                  </td>
                ))}
              </CompareRow>

              <CompareRow label="단점">
                {workbooks.map((wb) => (
                  <td key={wb.id} className="py-2.5 px-2 align-top">
                    {wb.cons.length > 0 ? (
                      <ul className="space-y-1">
                        {wb.cons.map((con, i) => (
                          <li key={i} className="text-xs leading-relaxed">
                            <span className="text-red-500 mr-1">-</span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "-"
                    )}
                  </td>
                ))}
              </CompareRow>

              <CompareRow label="추천 대상">
                {workbooks.map((wb) => (
                  <td key={wb.id} className="py-2.5 px-2 align-top text-xs leading-relaxed">
                    {wb.recommendedFor || "-"}
                  </td>
                ))}
              </CompareRow>
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
