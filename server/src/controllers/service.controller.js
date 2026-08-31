const errorResponse = require('../utils/errorResponse');
const prisma = require('../prisma');
const fs = require('fs');
const path = require('path');

const getAllServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: services });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch services', error);
  }
};

const getAdminServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: services });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch admin services', error);
  }
};

const getServiceById = async (req, res) => {
  try {
    const service = await prisma.service.findUnique({ where: { id: req.params.id } });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, data: service });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch service', error);
  }
};

const parseBool = (val) => {
  if (val === 'true') return true;
  if (val === 'false') return false;
  return Boolean(val);
};

const createService = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.pricingQuotationRequired !== undefined) data.pricingQuotationRequired = parseBool(data.pricingQuotationRequired);
    if (data.isActive !== undefined) data.isActive = parseBool(data.isActive);
    
    if (req.file) {
      data.imageUrl = req.file.path; // Cloudinary URL
    }

    const service = await prisma.service.create({ data });
    res.status(201).json({ success: true, message: 'Service created successfully', data: service });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to create service', error);
  }
};

const updateService = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.pricingQuotationRequired !== undefined) data.pricingQuotationRequired = parseBool(data.pricingQuotationRequired);
    if (data.isActive !== undefined) data.isActive = parseBool(data.isActive);
    
    if (req.file) {
      data.imageUrl = req.file.path; // Cloudinary URL
    }

    const service = await prisma.service.update({
      where: { id: req.params.id },
      data
    });
    res.json({ success: true, message: 'Service updated successfully', data: service });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update service', error);
  }
};

const updateServiceStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const service = await prisma.service.update({
      where: { id: req.params.id },
      data: { isActive: parseBool(isActive) }
    });
    res.json({ success: true, message: 'Service status updated successfully', data: service });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update service status', error);
  }
};

const deleteService = async (req, res) => {
  try {
    const service = await prisma.service.findUnique({ where: { id: req.params.id } });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });

    await prisma.service.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to delete service', error);
  }
};

module.exports = { getAllServices, getAdminServices, getServiceById, createService, updateService, updateServiceStatus, deleteService };
