import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, UserPlus, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

export default function QuickActionsWidget() {
  const actions = [
    {
      label: "New Campaign",
      icon: <PlusCircle className="h-5 w-5 mr-2" />,
      path: "/campaigns/new",
      className: "bg-blue-500 hover:bg-blue-600 text-white",
    },
    {
      label: "Add Contact",
      icon: <UserPlus className="h-5 w-5 mr-2" />,
      path: "/contacts",
      className: "bg-green-500 hover:bg-green-600 text-white",
    },
    {
      label: "Go to Inbox",
      icon: <MessageSquare className="h-5 w-5 mr-2" />,
      path: "/inbox",
      className: "bg-purple-500 hover:bg-purple-600 text-white",
    },
  ];

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {actions.map(action => (
            <Link to={action.path} key={action.label} className="no-underline">
              <Button
                size="lg"
                className={`w-full h-16 text-md font-semibold ${action.className}`}
              >
                {action.icon}
                {action.label}
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
