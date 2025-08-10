import React, { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { Card } from "../../components/ui/card";
import { Table, Thead, Tbody, Tr, Th, Td } from "../../components/ui/table";
import { format } from "date-fns";

const CTAFlowLogs = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    axiosClient.get("/tracking/flow-clicks").then(res => {
      setLogs(res.data);
    });
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">CTA Flow Click Logs</h2>
      <Card className="overflow-x-auto">
        <Table>
          <Thead>
            <Tr>
              <Th>Date</Th>
              <Th>Recipient</Th>
              <Th>Button</Th>
              <Th>Template</Th>
              <Th>Step ID</Th>
              <Th>Follow-Up</Th>
            </Tr>
          </Thead>
          <Tbody>
            {logs.map(log => (
              <Tr key={log.id}>
                <Td>
                  {format(new Date(log.clickedAt), "dd MMM yyyy hh:mm a")}
                </Td>
                <Td>{log.contactPhone}</Td>
                <Td>{log.buttonText}</Td>
                <Td>{log.templateId}</Td>
                <Td className="text-xs">{log.stepId}</Td>
                <Td>
                  {log.followUpSent ? (
                    <span className="text-green-600 font-semibold">✅ Yes</span>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>
    </div>
  );
};

export default CTAFlowLogs;
