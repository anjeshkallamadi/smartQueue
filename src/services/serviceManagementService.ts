import { supabase } from "../lib/supabase";

export type CreateServiceInput = {
  name: string;
  description: string;
  category: string;
  location: string;
  averageServiceTime: number;
};

export type CreatedService = {
  service_id: string;
  queue_id: string;
};

export type ServiceQueueDestination = {
  queueId: string;
  serviceName: string;
  description: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidServiceId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/** QR identifies a service permanently, not a particular daily queue. */
export function serviceQrValue(serviceId: string): string {
  if (!isValidServiceId(serviceId)) {
    throw new Error("Invalid service ID.");
  }
  return "smartqueue:///service/" + serviceId.toLowerCase();
}

/** Accept only SmartQueue-issued service URLs; reject arbitrary QR links. */
export function parseServiceQrValue(value: string): string | null {
  const match = /^smartqueue:\/\/\/?service\/([0-9a-f-]{36})\/?$/i.exec(value.trim());
  const id = match?.[1] ?? "";
  return isValidServiceId(id) ? id.toLowerCase() : null;
}

export async function createServiceWithQueue(
  values: CreateServiceInput
): Promise<CreatedService> {
  const name = values.name.trim();
  if (name.length < 3 || name.length > 100) {
    throw new Error("Service name must have 3 to 100 characters.");
  }
  if (values.description.length > 500 || values.category.length > 60 ||
      values.location.length > 160) {
    throw new Error("Some fields exceed their maximum length.");
  }
  if (!Number.isInteger(values.averageServiceTime) ||
      values.averageServiceTime < 1 || values.averageServiceTime > 240) {
    throw new Error("Average service time must be 1–240 minutes.");
  }

  const { data, error } = await supabase.rpc("create_service_queue", {
    p_name: name,
    p_description: values.description.trim() || null,
    p_category: values.category.trim() || null,
    p_location: values.location.trim() || null,
    p_average_service_time: values.averageServiceTime,
  });
  if (error) throw new Error(error.message);
  const created = (data as CreatedService[] | null)?.[0];
  if (!created?.service_id || !created.queue_id) {
    throw new Error("The service could not be created.");
  }
  return created;
}

/** Resolve the service QR to its newest currently active queue. */
export async function findActiveQueueForService(
  serviceId: string
): Promise<ServiceQueueDestination> {
  if (!isValidServiceId(serviceId)) {
    throw new Error("This QR does not contain a valid service ID.");
  }
  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, name, description, status")
    .eq("id", serviceId)
    .maybeSingle();
  if (serviceError) throw new Error(serviceError.message);
  if (!service || service.status !== "active") {
    throw new Error("This service is unavailable.");
  }

  const { data: queue, error: queueError } = await supabase
    .from("queues")
    .select("id")
    .eq("service_id", serviceId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (queueError) throw new Error(queueError.message);
  if (!queue) {
    throw new Error("No active queue is available for this service right now.");
  }
  return {
    queueId: queue.id,
    serviceName: service.name || "Service",
    description: service.description || "",
  };
}
