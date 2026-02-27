const nodemailer = require('nodemailer');

/**
 * Email Service using Nodemailer
 */
class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
            port: process.env.EMAIL_PORT || 587,
            secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER || 'placeholder@example.com',
                pass: process.env.EMAIL_PASS || 'password_here',
            },
        });
    }

    async sendEmail({ to, subject, text, html }) {
        try {
            console.log(`[EMAIL] Attempting to send email to: ${to}`);
            console.log(`[EMAIL] Subject: ${subject}`);
            
            const info = await this.transporter.sendMail({
                from: `"EstatePulse AI" <${process.env.EMAIL_USER || 'no-reply@estatepulse.ai'}>`,
                to,
                subject,
                text,
                html,
            });
            
            console.log(`[EMAIL] ✓ Message sent successfully: ${info.messageId}`);
            console.log(`[EMAIL] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
            return info;
        } catch (error) {
            console.error('[EMAIL] ✗ Send Error:', error.message);
            console.error('[EMAIL] Error details:', error);
            return null;
        }
    }

    /**
     * Helper to send both Buyer and Seller emails
     */
    async sendRealEstateLeads({ buyer, seller, property, orchestration }) {
        console.log(`[EMAIL] ═══════════════════════════════════════════════`);
        console.log(`[EMAIL] Preparing to send emails for property: ${property.title}`);
        console.log(`[EMAIL] Buyer: ${buyer.name} (${buyer.email})`);
        console.log(`[EMAIL] Seller: ${seller.name} (${seller.email})`);
        console.log(`[EMAIL] ═══════════════════════════════════════════════`);

        // 1. Email to Buyer
        const buyerHtml = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; background: #f8fafc;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 32px 24px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">🎉 Great News, ${buyer.name}!</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">The owner is excited to connect with you</p>
                </div>

                <!-- Main Content -->
                <div style="background: white; padding: 32px 24px;">
                    <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hi <strong>${buyer.name}</strong>,
                    </p>
                    
                    <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                        We noticed you showed interest in <strong style="color: #3b82f6;">${property.title}</strong>. This is a fantastic ${property.bedrooms || ''}${property.bedrooms ? ' BHK' : ''} property located in <strong>${property.location || property.city}</strong>, priced at <strong style="color: #10b981;">₹${property.price?.toLocaleString()}</strong>.
                    </p>

                    <div style="background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 24px 0; border-radius: 8px;">
                        <p style="color: #1e293b; font-size: 15px; margin: 0; line-height: 1.6;">
                            <strong>🎊 Exciting Update:</strong> We've already informed the owner about your interest, and they are very excited to discuss this opportunity with you!
                        </p>
                    </div>

                    <!-- Owner Details Card -->
                    <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 24px; border-radius: 12px; margin: 24px 0; border: 2px solid #3b82f6;">
                        <h3 style="color: #1e40af; margin: 0 0 16px 0; font-size: 18px; font-weight: 700;">📞 Owner Contact Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Name:</td>
                                <td style="padding: 8px 0; color: #1e293b; font-size: 15px; font-weight: 700;">${seller.name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Email:</td>
                                <td style="padding: 8px 0; color: #3b82f6; font-size: 15px; font-weight: 600;">${seller.email}</td>
                            </tr>
                            ${seller.phoneNumber ? `
                            <tr>
                                <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Phone:</td>
                                <td style="padding: 8px 0; color: #1e293b; font-size: 15px; font-weight: 700;">${seller.phoneNumber}</td>
                            </tr>
                            ` : ''}
                        </table>
                    </div>

                    <!-- Call to Action -->
                    <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 12px; margin: 24px 0;">
                        <p style="color: #92400e; font-size: 15px; margin: 0 0 12px 0; font-weight: 600;">
                            ⚡ <strong>Quick Action Required:</strong>
                        </p>
                        <p style="color: #78350f; font-size: 14px; margin: 0; line-height: 1.6;">
                            Please reach out to the owner within the next <strong>3-5 minutes</strong> while they're available. You can also visit the <strong>EstatePulse platform</strong> and check your messages - the owner will be reaching out to you there as well!
                        </p>
                    </div>

                    <!-- Platform Button -->
                    <div style="text-align: center; margin: 32px 0 24px 0;">
                        <a href="http://localhost:5173/messages" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);">
                            💬 Open EstatePulse Chat
                        </a>
                    </div>

                    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                        Best of luck with your property search!<br>
                        <strong style="color: #3b82f6;">Team EstatePulse</strong>
                    </p>
                </div>

                <!-- Footer -->
                <div style="background: #f1f5f9; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: #64748b; font-size: 12px; margin: 0; line-height: 1.5;">
                        EstatePulse AI — Your Premium Property Broker<br>
                        Connecting buyers and sellers with intelligent matching
                    </p>
                </div>
            </div>
        `;

        // 2. Email to Seller
        const sellerHtml = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; background: #f8fafc;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px 24px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">🔥 New High-Priority Lead!</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">A verified buyer is interested in your property</p>
                </div>

                <!-- Main Content -->
                <div style="background: white; padding: 32px 24px;">
                    <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hi <strong>${seller.name}</strong>,
                    </p>
                    
                    <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                        Great news! A verified buyer has shown strong interest in your property <strong style="color: #f59e0b;">${property.title}</strong>. This is a quality lead worth pursuing immediately.
                    </p>

                    <!-- Lead Score Card -->
                    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 24px; border-radius: 12px; margin: 24px 0; border: 2px solid #f59e0b;">
                        <div style="display: flex; align-items: center; margin-bottom: 16px;">
                            <h3 style="color: #92400e; margin: 0; font-size: 18px; font-weight: 700;">📊 Lead Quality Score</h3>
                        </div>
                        <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: #78350f; font-size: 14px; font-weight: 600;">Intent Score:</span>
                                <span style="color: #f59e0b; font-size: 24px; font-weight: 800;">${orchestration.leadScore}/100</span>
                            </div>
                        </div>
                        <div style="background: white; padding: 12px; border-radius: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: #78350f; font-size: 14px; font-weight: 600;">Priority Level:</span>
                                <span style="background: ${orchestration.priority === 'High' ? '#dc2626' : orchestration.priority === 'Medium' ? '#f59e0b' : '#10b981'}; color: white; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 700;">${orchestration.priority.toUpperCase()}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Buyer Details Card -->
                    <div style="background: #f1f5f9; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #3b82f6;">
                        <h3 style="color: #1e40af; margin: 0 0 16px 0; font-size: 18px; font-weight: 700;">👤 Buyer Information</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Name:</td>
                                <td style="padding: 8px 0; color: #1e293b; font-size: 15px; font-weight: 700;">${buyer.name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Profession:</td>
                                <td style="padding: 8px 0; color: #1e293b; font-size: 15px; font-weight: 700;">${buyer.profession || 'Verified Member'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Email:</td>
                                <td style="padding: 8px 0; color: #3b82f6; font-size: 15px; font-weight: 600;">${buyer.email}</td>
                            </tr>
                            ${buyer.phoneNumber ? `
                            <tr>
                                <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Phone:</td>
                                <td style="padding: 8px 0; color: #1e293b; font-size: 15px; font-weight: 700;">${buyer.phoneNumber}</td>
                            </tr>
                            ` : ''}
                        </table>
                    </div>

                    <!-- AI Insight -->
                    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 24px 0; border-radius: 8px;">
                        <p style="color: #1e40af; font-size: 14px; margin: 0; line-height: 1.6;">
                            <strong>🤖 AI Insight:</strong> ${orchestration.sellerEmailSnippet || orchestration.sellerMessage}
                        </p>
                    </div>

                    <!-- Call to Action -->
                    <div style="background: #dcfce7; border: 2px solid #10b981; padding: 20px; border-radius: 12px; margin: 24px 0;">
                        <p style="color: #065f46; font-size: 15px; margin: 0 0 12px 0; font-weight: 600;">
                            ⚡ <strong>Action Required:</strong>
                        </p>
                        <p style="color: #047857; font-size: 14px; margin: 0; line-height: 1.6;">
                            Reach out to this buyer within the next <strong>3-5 minutes</strong> while their interest is high! You can also message them directly on the <strong>EstatePulse platform</strong> - they'll be waiting for your response.
                        </p>
                    </div>

                    <!-- Platform Button -->
                    <div style="text-align: center; margin: 32px 0 24px 0;">
                        <a href="http://localhost:5173/messages" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);">
                            💬 Message Buyer Now
                        </a>
                    </div>

                    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                        Strike while the iron is hot!<br>
                        <strong style="color: #f59e0b;">Team EstatePulse</strong>
                    </p>
                </div>

                <!-- Footer -->
                <div style="background: #f1f5f9; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: #64748b; font-size: 12px; margin: 0; line-height: 1.5;">
                        EstatePulse AI — Intelligence for Sellers<br>
                        Helping you connect with serious, verified buyers
                    </p>
                </div>
            </div>
        `;

        const tasks = [
            this.sendEmail({ to: buyer.email, subject: `Owner Details for ${property.title}`, html: buyerHtml }),
            this.sendEmail({ to: seller.email, subject: `URGENT: High Intent Lead for ${property.title}`, html: sellerHtml })
        ];

        const results = await Promise.all(tasks);
        console.log(`[EMAIL] ═══════════════════════════════════════════════`);
        console.log(`[EMAIL] Email sending completed. Results:`, results.map(r => r ? '✓ Success' : '✗ Failed'));
        console.log(`[EMAIL] ═══════════════════════════════════════════════`);
        return results;
    }
}

module.exports = new EmailService();
