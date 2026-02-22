import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";
import React from "react";

interface CustomBreadCrumbProps {
  breadCrumbPage: string;
  breadCrumpItems?: { link: string; label: string }[];
  enabled?: boolean;
}

export const CustomBreadCrumb = ({
  breadCrumbPage,
  breadCrumpItems,
  enabled = true,
}: CustomBreadCrumbProps) => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            href={enabled ? "/" : undefined}
            onClick={(e) => !enabled && e.preventDefault()}
            className={`flex items-center justify-center ${
              enabled ? "hover:text-emerald-500" : "opacity-30 pointer-events-none select-none"
            }`}
            aria-disabled={!enabled}
          >
            <Home className="w-3 h-3 mr-2" />
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>

        {breadCrumpItems &&
          breadCrumpItems.map((item, i) => (
            <React.Fragment key={i}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  href={enabled ? item.link : undefined}
                  onClick={(e) => !enabled && e.preventDefault()}
                  className={
                    enabled ? "hover:text-emerald-500" : "opacity-30 pointer-events-none select-none"
                  }
                  aria-disabled={!enabled}
                >
                  {item.label}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{breadCrumbPage}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};
