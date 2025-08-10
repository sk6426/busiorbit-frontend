import * as React from "react";

export function Tabs({ defaultValue, children }) {
  const [value, setValue] = React.useState(defaultValue);
  return (
    <div className="w-full">
      {React.Children.map(children, child =>
        React.cloneElement(child, { value, setValue })
      )}
    </div>
  );
}

export function TabsList({ children, value, setValue }) {
  return (
    <div className="flex border-b">
      {React.Children.map(children, child =>
        React.cloneElement(child, { value, setValue })
      )}
    </div>
  );
}

export function TabsTrigger({ children, value: tabValue, setValue, value }) {
  const isActive = value === tabValue;
  return (
    <button
      onClick={() => setValue(tabValue)}
      className={`text-sm px-4 py-2 -mb-px border-b-2 ${
        isActive
          ? "border-purple-600 text-purple-600 font-semibold"
          : "border-transparent text-gray-500"
      }`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ children, value, value: tabValue }) {
  return value === tabValue ? <div className="py-2">{children}</div> : null;
}
