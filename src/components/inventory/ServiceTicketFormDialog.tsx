import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";
import { useNextTicketNumber, useCreateServiceTicket, useUpdateServiceTicket, ServiceTicket } from "@/hooks/useServiceTickets";
import { toast } from "sonner";

interface ServiceTicketFormDialogProps {
  ticket?: ServiceTicket;
  trigger?: React.ReactNode;
}

const DEVICE_TYPES = ["Laptop", "Desktop", "Printer", "Scanner", "Monitor", "UPS", "Router", "Switch", "Server", "Other"];
const STATUS_OPTIONS = [
  { value: "received", label: "Received" },
  { value: "diagnosing", label: "Diagnosing" },
  { value: "waiting_parts", label: "Waiting for Parts" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export function ServiceTicketFormDialog({ ticket, trigger }: ServiceTicketFormDialogProps) {
  const [open, setOpen] = useState(false);
  const { data: customers = [] } = useCustomers();
  const { data: nextTicketNo } = useNextTicketNumber();
  const createTicket = useCreateServiceTicket();
  const updateTicket = useUpdateServiceTicket();
  const isEditing = !!ticket;

  const [formData, setFormData] = useState({
    ticket_no: ticket?.ticket_no || "",
    customer_id: ticket?.customer_id || "",
    customer_name: ticket?.customer_name || "",
    customer_phone: ticket?.customer_phone || "",
    device_type: ticket?.device_type || "",
    brand: ticket?.brand || "",
    model: ticket?.model || "",
    serial_number: ticket?.serial_number || "",
    problem_description: ticket?.problem_description || "",
    diagnosis: ticket?.diagnosis || "",
    resolution: ticket?.resolution || "",
    status: ticket?.status || "received",
    received_date: ticket?.received_date || new Date().toISOString().split("T")[0],
    estimated_completion: ticket?.estimated_completion || "",
    estimated_cost: ticket?.estimated_cost?.toString() || "0",
    final_cost: ticket?.final_cost?.toString() || "0",
    technician_notes: ticket?.technician_notes || "",
  });

  useEffect(() => {
    if (!isEditing && nextTicketNo) {
      setFormData(prev => ({ ...prev, ticket_no: nextTicketNo }));
    }
  }, [nextTicketNo, isEditing]);

  const resetForm = () => {
    setFormData({
      ticket_no: nextTicketNo || "",
      customer_id: "",
      customer_name: "",
      customer_phone: "",
      device_type: "",
      brand: "",
      model: "",
      serial_number: "",
      problem_description: "",
      diagnosis: "",
      resolution: "",
      status: "received",
      received_date: new Date().toISOString().split("T")[0],
      estimated_completion: "",
      estimated_cost: "0",
      final_cost: "0",
      technician_notes: "",
    });
  };

  const handleCustomerChange = (customerId: string) => {
    if (customerId === "walk-in") {
      setFormData(prev => ({ ...prev, customer_id: "", customer_name: "", customer_phone: "" }));
    } else {
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        setFormData(prev => ({
          ...prev,
          customer_id: customerId,
          customer_name: customer.name,
          customer_phone: customer.phone || "",
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.device_type) {
      toast.error("Please select a device type");
      return;
    }
    
    if (!formData.problem_description.trim()) {
      toast.error("Please describe the problem");
      return;
    }

    const ticketData = {
      ticket_no: formData.ticket_no,
      customer_id: formData.customer_id || null,
      customer_name: formData.customer_name.trim() || null,
      customer_phone: formData.customer_phone.trim() || null,
      device_type: formData.device_type,
      brand: formData.brand.trim() || null,
      model: formData.model.trim() || null,
      serial_number: formData.serial_number.trim() || null,
      problem_description: formData.problem_description.trim(),
      diagnosis: formData.diagnosis.trim() || null,
      resolution: formData.resolution.trim() || null,
      status: formData.status as ServiceTicket["status"],
      received_date: formData.received_date,
      estimated_completion: formData.estimated_completion || null,
      completed_date: formData.status === "completed" ? new Date().toISOString().split("T")[0] : null,
      delivered_date: formData.status === "delivered" ? new Date().toISOString().split("T")[0] : null,
      estimated_cost: parseFloat(formData.estimated_cost) || 0,
      final_cost: parseFloat(formData.final_cost) || 0,
      parts_used: null,
      technician_notes: formData.technician_notes.trim() || null,
    };

    try {
      if (isEditing) {
        await updateTicket.mutateAsync({ id: ticket.id, ...ticketData });
        toast.success("Service ticket updated");
      } else {
        await createTicket.mutateAsync(ticketData);
        toast.success("Service ticket created");
        resetForm();
      }
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save service ticket");
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Service Ticket
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? `Edit Ticket #${ticket.ticket_no}` : "New Service Ticket"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="ticket_no">Ticket No</Label>
              <Input
                id="ticket_no"
                value={formData.ticket_no}
                onChange={(e) => handleChange("ticket_no", e.target.value)}
                placeholder="SVC-001"
              />
            </div>
            <div>
              <Label htmlFor="received_date">Received Date</Label>
              <Input
                id="received_date"
                type="date"
                value={formData.received_date}
                onChange={(e) => handleChange("received_date", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Customer Information</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Select Customer</Label>
                <Select
                  value={formData.customer_id || "walk-in"}
                  onValueChange={handleCustomerChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Walk-in customer" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="customer_name">Customer Name</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => handleChange("customer_name", e.target.value)}
                  placeholder="Customer name"
                />
              </div>
              <div>
                <Label htmlFor="customer_phone">Phone</Label>
                <Input
                  id="customer_phone"
                  value={formData.customer_phone}
                  onChange={(e) => handleChange("customer_phone", e.target.value)}
                  placeholder="Phone number"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Device Information</h4>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="device_type">Device Type *</Label>
                <Select
                  value={formData.device_type}
                  onValueChange={(value) => handleChange("device_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {DEVICE_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => handleChange("brand", e.target.value)}
                  placeholder="e.g., HP, Dell"
                />
              </div>
              <div>
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => handleChange("model", e.target.value)}
                  placeholder="Model number"
                />
              </div>
              <div>
                <Label htmlFor="serial_number">Serial Number</Label>
                <Input
                  id="serial_number"
                  value={formData.serial_number}
                  onChange={(e) => handleChange("serial_number", e.target.value)}
                  placeholder="Device S/N"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Problem & Resolution</h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="problem_description">Problem Description *</Label>
                <Textarea
                  id="problem_description"
                  value={formData.problem_description}
                  onChange={(e) => handleChange("problem_description", e.target.value)}
                  placeholder="Describe the issue reported by customer"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="diagnosis">Diagnosis</Label>
                  <Textarea
                    id="diagnosis"
                    value={formData.diagnosis}
                    onChange={(e) => handleChange("diagnosis", e.target.value)}
                    placeholder="Technical diagnosis"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="resolution">Resolution</Label>
                  <Textarea
                    id="resolution"
                    value={formData.resolution}
                    onChange={(e) => handleChange("resolution", e.target.value)}
                    placeholder="How it was fixed"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Cost & Notes</h4>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="estimated_completion">Est. Completion</Label>
                <Input
                  id="estimated_completion"
                  type="date"
                  value={formData.estimated_completion}
                  onChange={(e) => handleChange("estimated_completion", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="estimated_cost">Est. Cost (₹)</Label>
                <Input
                  id="estimated_cost"
                  type="number"
                  min="0"
                  value={formData.estimated_cost}
                  onChange={(e) => handleChange("estimated_cost", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="final_cost">Final Cost (₹)</Label>
                <Input
                  id="final_cost"
                  type="number"
                  min="0"
                  value={formData.final_cost}
                  onChange={(e) => handleChange("final_cost", e.target.value)}
                />
              </div>
              <div className="col-span-4">
                <Label htmlFor="technician_notes">Technician Notes</Label>
                <Textarea
                  id="technician_notes"
                  value={formData.technician_notes}
                  onChange={(e) => handleChange("technician_notes", e.target.value)}
                  placeholder="Internal notes"
                  rows={2}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTicket.isPending || updateTicket.isPending}>
              {isEditing ? "Update" : "Create"} Ticket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
