/*
Copyright (c) 2023-present Amidaware Inc.
This file is subject to the EE License Agreement.
For details, see: https://license.tacticalrmm.com/ee
*/

import axios from "axios";
import { exportFile } from "quasar";
import { ref, type Ref } from "vue";
import type {
  ReportTemplate,
  ReportHTMLTemplate,
  ReportDataQuery,
  UploadAssetsResponse,
  RunReportPreviewRequest,
} from "../types/reporting";
import type { QTreeFileNode } from "@/types/filebrowser";
import { notifySuccess } from "@/utils/notify";

const baseUrl = "/reporting";

export interface useReportingTemplates {
  reportTemplates: Ref<ReportTemplate[]>;
  isLoading: Ref<boolean>;
  isError: Ref<boolean>;
  getReportTemplates: () => void;
  addReportTemplate: (payload: ReportTemplate) => void;
  editReportTemplate: (id: number, payload: ReportTemplate) => void;
  deleteReportTemplate: (id: number) => void;
  renderedPreview: Ref<string>;
  runReportPreview: (payload: RunReportPreviewRequest) => void;
  reportData: Ref<string>;
  runReport: (id: number, payload: ReportTemplate) => void;
}

// reporting endpoints
export function useReportTemplates(): useReportingTemplates {
  const reportTemplates = ref<ReportTemplate[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);
  const renderedPreview = ref("");
  const reportData = ref("");

  const getReportTemplates = () => {
    isLoading.value = true;
    isError.value = false;
    axios
      .get(`${baseUrl}/templates/`)
      .then(({ data }) => {
        reportTemplates.value = data;
      })
      .catch(() => (isError.value = true))
      .finally(() => (isLoading.value = false));

    isLoading.value = false;
  };

  function deleteReportTemplate(id: number) {
    isLoading.value = true;
    isError.value = false;
    axios
      .delete(`${baseUrl}/templates/${id}/`)
      .then(() => {
        reportTemplates.value = reportTemplates.value.filter(
          (template) => template.id != id
        );
        notifySuccess("The report template was successfully removed");
      })
      .catch(() => (isError.value = true))
      .finally(() => (isLoading.value = false));
  }

  function addReportTemplate(payload: ReportTemplate) {
    isLoading.value = true;
    isError.value = false;
    axios
      .post(`${baseUrl}/templates/`, payload)
      .then(({ data }: { data: ReportTemplate }) => {
        reportTemplates.value.push(data);
        notifySuccess("The report template was added successfully");
      })
      .catch(() => (isError.value = true))
      .finally(() => (isLoading.value = false));
  }

  function editReportTemplate(id: number, payload: ReportTemplate) {
    isLoading.value = true;
    isError.value = false;
    axios
      .put(`${baseUrl}/templates/${id}/`, payload)
      .then(({ data }: { data: ReportTemplate }) => {
        const index = reportTemplates.value.findIndex(
          (template) => template.id === id
        );
        reportTemplates.value[index] = data;
        notifySuccess("The report template was edited successfully");
      })
      .catch(() => (isError.value = true))
      .finally(() => (isLoading.value = false));
  }

  function runReportPreview(payload: RunReportPreviewRequest) {
    isLoading.value = true;
    isError.value = false;
    renderedPreview.value = "";
    axios
      .post(`${baseUrl}/templates/preview/`, payload, {
        responseType: payload.format === "html" ? "json" : "blob",
      })
      .then(({ data }) => {
        if (payload.format === "html") {
          renderedPreview.value = data;
        } else {
          renderedPreview.value = URL.createObjectURL(data);
        }
      })
      .catch(() => (isError.value = true))
      .finally(() => (isLoading.value = false));
  }

  function runReport(id: number, payload: ReportTemplate): void {
    isLoading.value = true;
    isError.value = false;
    axios
      .post(`${baseUrl}/templates/${id}/run/`, payload, {
        responseType: "blob",
      })
      .then(({ data }) => {
        reportData.value = data;
        exportFile("Report.pdf", data, {
          mimeType: "application/pdf",
        });
      })
      .catch(() => (isError.value = true))
      .finally(() => (isLoading.value = false));
  }

  return {
    reportTemplates,
    isLoading,
    isError,
    getReportTemplates,
    addReportTemplate,
    editReportTemplate,
    deleteReportTemplate,
    renderedPreview,
    runReportPreview,
    reportData,
    runReport,
  };
}

export const useSharedReportTemplates = useReportTemplates();

// reporting asset endpoints
export async function fetchReportAssets(
  path?: string,
  folderOnly?: boolean
): Promise<QTreeFileNode[]> {
  const params = {} as { path?: string; folders?: boolean };
  if (path) params.path = path;
  if (folderOnly) params.folders = true;

  const { data } = await axios.get(`${baseUrl}/assets/`, { params: params });
  return data;
}

export async function fetchAllReportAssets(
  foldersOnly?: boolean
): Promise<QTreeFileNode[]> {
  const params = {} as { onlyFolders?: boolean };
  if (foldersOnly) params.onlyFolders = true;

  const { data } = await axios.get(`${baseUrl}/assets/all/`, {
    params: params,
  });
  return data;
}

export async function renameReportAsset(
  path: string,
  newName: string
): Promise<string> {
  const payload = { path, newName };
  const { data } = await axios.put(`${baseUrl}/assets/rename/`, payload);
  return data;
}

export async function createAssetFolder(path: string): Promise<string> {
  const payload = { path };
  const { data } = await axios.post(`${baseUrl}/assets/newfolder/`, payload);
  return data;
}

export async function deleteAssets(paths: string[]): Promise<undefined> {
  const payload = { paths };
  const { data } = await axios.post(`${baseUrl}/assets/delete/`, payload);
  return data;
}

export async function downloadAsset(path: string): Promise<Blob> {
  const params = path ? { path } : {};
  const { data } = await axios.get(`${baseUrl}/assets/download/`, {
    responseType: "blob",
    params: params,
  });
  return data;
}

export async function uploadAssets(
  form: FormData,
  path = ""
): Promise<UploadAssetsResponse> {
  form.append("parentPath", path);
  const { data } = await axios.post(`${baseUrl}/assets/upload/`, form);
  return data;
}

// reporting html templates endpoints
export interface useReportingHTMLTemplates {
  reportHTMLTemplates: Ref<ReportHTMLTemplate[]>;
  isLoading: Ref<boolean>;
  isError: Ref<boolean>;
  getReportHTMLTemplates: () => void;
  addReportHTMLTemplate: (payload: ReportHTMLTemplate) => void;
  editReportHTMLTemplate: (id: number, payload: ReportHTMLTemplate) => void;
  deleteReportHTMLTemplate: (id: number) => void;
}

export function useReportingHTMLTemplates(): useReportingHTMLTemplates {
  const reportHTMLTemplates = ref<ReportHTMLTemplate[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);

  function getReportHTMLTemplates() {
    axios
      .get(`${baseUrl}/htmltemplates/`)
      .then(({ data }) => {
        reportHTMLTemplates.value = data;
      })
      .catch(() => (isError.value = true))
      .finally(() => (isLoading.value = false));
  }

  function addReportHTMLTemplate(payload: ReportHTMLTemplate) {
    isLoading.value = true;
    axios
      .post(`${baseUrl}/htmltemplates/`, payload)
      .then(({ data }: { data: ReportHTMLTemplate }) => {
        reportHTMLTemplates.value.push(data);
        notifySuccess("HTML Template was added successfully");
      })
      .catch(() => (isError.value = true))
      .finally(() => (isLoading.value = false));
  }

  function editReportHTMLTemplate(id: number, payload: ReportHTMLTemplate) {
    isLoading.value = true;
    axios
      .put(`${baseUrl}/htmltemplates/${id}/`, payload)
      .then(({ data }: { data: ReportHTMLTemplate }) => {
        const index = reportHTMLTemplates.value.findIndex(
          (template) => template.id === id
        );
        reportHTMLTemplates.value[index] = data;
        notifySuccess("HTML Template was edited successfully");
      })
      .catch(() => (isError.value = true))
      .finally(() => (isLoading.value = false));
  }

  function deleteReportHTMLTemplate(id: number) {
    isLoading.value = true;
    axios
      .delete(`${baseUrl}/htmltemplates/${id}/`)
      .then(() => {
        reportHTMLTemplates.value = reportHTMLTemplates.value.filter(
          (template) => template.id != id
        );
        notifySuccess("The HTML template was successfully removed");
      })
      .catch(() => (isError.value = true))
      .finally(() => (isLoading.value = false));
  }

  return {
    reportHTMLTemplates,
    isLoading,
    isError,
    getReportHTMLTemplates,
    addReportHTMLTemplate,
    editReportHTMLTemplate,
    deleteReportHTMLTemplate,
  };
}

// Use if you want the state to be consistent across components
export const useSharedReportHTMLTemplates = useReportingHTMLTemplates();

// reporting data query endpoints
export interface useReportingDataQueries {
  reportDataQueries: Ref<ReportDataQuery[]>;
  isLoading: Ref<boolean>;
  isError: Ref<boolean>;
  getReportDataQueries: () => void;
  addReportDataQuery: (payload: ReportDataQuery) => void;
  editReportDataQuery: (id: number, payload: ReportDataQuery) => void;
  deleteReportDataQuery: (id: number) => void;
}

export function useReportingDataQueries(): useReportingDataQueries {
  const reportDataQueries = ref<ReportDataQuery[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);

  function getReportDataQueries() {
    axios
      .get(`${baseUrl}/dataqueries/`)
      .then(({ data }) => {
        isLoading.value = true;
        reportDataQueries.value = data;
      })
      .catch(() => (isError.value = true))
      .finally(() => (isLoading.value = false));
  }

  function addReportDataQuery(payload: ReportDataQuery) {
    axios
      .post(`${baseUrl}/dataqueries/`, payload)
      .then(({ data }: { data: ReportDataQuery }) => {
        isLoading.value = true;
        reportDataQueries.value.push(data);
        notifySuccess("Data Query was added successfully");
      })
      .catch(() => (isError.value = true))
      .finally(() => (isLoading.value = false));
  }

  function editReportDataQuery(id: number, payload: ReportDataQuery) {
    axios
      .put(`${baseUrl}/dataqueries/${id}/`, payload)
      .then(({ data }: { data: ReportDataQuery }) => {
        isLoading.value = true;
        const index = reportDataQueries.value.findIndex(
          (template) => template.id === id
        );
        reportDataQueries.value[index] = data;
        notifySuccess("Data Query was edited successfully");
      })
      .catch(() => (isError.value = true))
      .finally(() => (isLoading.value = false));
  }

  function deleteReportDataQuery(id: number) {
    axios
      .delete(`${baseUrl}/dataqueries/${id}/`)
      .then(() => {
        reportDataQueries.value = reportDataQueries.value.filter(
          (template) => template.id != id
        );
        notifySuccess("The Data Query was successfully removed");
      })
      .catch(() => (isError.value = true))
      .finally(() => (isLoading.value = false));
  }

  return {
    reportDataQueries,
    isLoading,
    isError,
    getReportDataQueries,
    addReportDataQuery,
    editReportDataQuery,
    deleteReportDataQuery,
  };
}

// Use if you want the state to be consistent across components
export const useSharedReportDataQueries = useReportingDataQueries();
