const prisma = require('../prisma');
const errorResponse = require('../utils/errorResponse');

const getSettings = async (req, res) => {
  try {
    const keys = req.query.keys ? req.query.keys.split(',') : [];

    let where = {};
    if (keys.length > 0) {
      where.key = { in: keys };
    }

    const configs = await prisma.siteConfig.findMany({ where });
    const settingsMap = configs.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    res.json({ success: true, data: settingsMap });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch settings', error);
  }
};

const updateSettings = async (req, res) => {
  try {
    const settings = req.body;

    // settings should be an object: { 'company_name': '...', 'company_gstin': '...' }
    const promises = Object.entries(settings).map(([key, value]) => {
      return prisma.siteConfig.upsert({
        where: { key },
        update: { value: value.toString() },
        create: { key, value: value.toString() }
      });
    });

    await prisma.$transaction(promises);

    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update settings', error);
  }
};

const getInvoiceSettings = async (req, res) => {
  try {
    let settings = await prisma.invoiceSettings.findUnique({
      where: { id: 'default' }
    });

    if (!settings) {
      settings = await prisma.invoiceSettings.create({
        data: {
          id: 'default',
          companyName: 'TAMILARASU ENTERPRISES',
          businessType: 'Import \u2022 Export \u2022 Trading',
          defaultCurrency: 'INR',
          invoicePrefix: 'TE',
          gstin: '33CEGPV1765R1ZO',
          pan: 'CEGPVXXXXR',
          phone: '+91 6383772487',
          bankName: 'Bank of Baroda',
          branch: 'UTHIRAMERUR',
          accountName: 'TAMILARASU ENTERPRISES',
          accountNumber: '532902XXXXX244',
          ifsc: 'BARB0UTHIRA',
        }
      });
    }

    res.json({ success: true, data: settings });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch invoice settings', error);
  }
};

const updateInvoiceSettings = async (req, res) => {
  try {
    const data = req.body;

    // Prevent overriding the ID
    delete data.id;

    const settings = await prisma.invoiceSettings.upsert({
      where: { id: 'default' },
      update: data,
      create: {
        id: 'default',
        ...data
      }
    });

    res.json({ success: true, message: 'Invoice settings updated successfully', data: settings });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update invoice settings', error);
  }
};

module.exports = { getSettings, updateSettings, getInvoiceSettings, updateInvoiceSettings };
