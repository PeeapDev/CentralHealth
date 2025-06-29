import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyStaffAuth } from "@/lib/staff-auth";
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Define the UserRole enum to match the schema
enum UserRole {
  PATIENT = "PATIENT",
  DOCTOR = "DOCTOR",
  STAFF = "STAFF",
  MANAGER = "MANAGER",
  ADMIN = "ADMIN"
}

// Validation schema for staff
const staffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  role: z.enum([UserRole.DOCTOR, UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN]),
  specialties: z.array(z.string()).optional(),
  salary: z.number().nonnegative().optional(),
  telemedicineEnabled: z.boolean().optional(),
  onlineBookingEnabled: z.boolean().optional(),
  // Contact information fields
  address: z.string().optional(),
  phone: z.string().optional(),
  gender: z.string().optional(),
  shift: z.string().optional(),
  taxRate: z.number().optional(),
  // Note: department and canChatWithPatients are removed as they don't exist in the schema
});

// GET /api/hospitals/[hospitalName]/staff - Get all staff for a hospital
export async function GET(
  request: NextRequest,
  context: { params: { hospitalName: string } }
) {
  // In Next.js App Router, we need to properly handle params
  // Use destructuring to avoid the synchronous access issue
  const { hospitalName } = await Promise.resolve(context.params);
  
  console.log(`[Staff API] Processing GET request for hospital: ${hospitalName}`);
  
  try {
    // Authenticate request using our staff authentication middleware
    const authResult = await verifyStaffAuth(request, hospitalName);
    console.log('[Staff API][GET] authResult from verifyStaffAuth:', JSON.stringify(authResult, null, 2));
    
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || 'Authentication failed' }, 
      { status: authResult.status || 401 });
    }
    
    // Only hospital admins or super admins should be able to access the staff list
    if (!(authResult.isHospitalAdmin || authResult.isSuperAdmin || authResult.user?.role === UserRole.ADMIN || authResult.user?.role === UserRole.MANAGER)) {
      // Create audit log for unauthorized access attempt
      await prisma.securityAuditLog.create({
        data: {
          action: 'UNAUTHORIZED_STAFF_LIST_ACCESS',
          userId: authResult.user?.id || 'unknown',
          success: false,
          details: `Unauthorized attempt to access staff list for hospital ${hospitalName}`,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || undefined,
          requestPath: request.nextUrl.pathname,
        }
      }).catch(err => console.error('Failed to log security event:', err));
      
      return NextResponse.json({ error: 'Access denied: Insufficient privileges' }, { status: 403 });
    }
    
    console.log(`[Staff API] Staff management access granted to ${authResult.user?.email} with role ${authResult.user?.role}`);

    console.log(`[Staff API] Searching for hospital with identifier '${hospitalName}'`);
    
    // Get comprehensive debug info about all hospitals in database
    const allHospitals = await prisma.hospital.findMany();
    console.log('[Staff API] Available hospitals in the database:');
    allHospitals.forEach((h: any) => {
      console.log(`  - ID: ${h.id}, Name: ${h.name || 'N/A'}, Subdomain: ${h.subdomain || 'N/A'}, Code: ${h.code || 'N/A'}, isActive: ${h.isActive}`);
    });
    
    // Try each field explicitly and log the query and results
    // Unified hospital lookup: search by subdomain, name, or code in a single query for reliability
    let hospital = await prisma.hospital.findFirst({
      where: {
        OR: [
          { subdomain: hospitalName },
          { name: hospitalName },
          { code: hospitalName },
        ],
      },
    });

    if (hospital) {
      console.log(`[Staff API] Found hospital by subdomain: ${hospital.subdomain}, name: ${hospital.name}, id: ${hospital.id}`);
    } else {
      console.log(`[Staff API] No hospital found with subdomain: ${hospitalName}`);

      // Try by name
      console.log(`[Staff API] Attempting to find hospital with name: '${hospitalName}'`);
      hospital = await prisma.hospital.findFirst({
        where: {
          name: hospitalName,
          isActive: true,
        },
      });

      // Try by code field
      if (!hospital) {
        console.log(`[Staff API] Attempting to find hospital with code: '${hospitalName}'`);
        hospital = await prisma.hospital.findFirst({
          where: {
            code: hospitalName,
            isActive: true,
          },
        });
      }

      if (hospital) {
        console.log(`[Staff API] Found hospital by name/code: ${hospital.name}, id: ${hospital.id}`);
      } else {
        console.log(`[Staff API] No hospital found with name or code: ${hospitalName}`);

        // Last attempt - case-insensitive search or look for slugs in the hospital object
        console.log(`[Staff API] Attempting case-insensitive search and additional fields...`);
        const lowercaseHospitalName = hospitalName.toLowerCase();
        
        // Try to find by slug property if it exists in any hospital
        const potentialMatchesBySlug = allHospitals.filter(h => {
          // Check if hospital has a 'slug' property in settings or elsewhere
          const settings = h.settings as any;
          return settings && settings.slug && settings.slug.toLowerCase() === lowercaseHospitalName;
        });
        
        if (potentialMatchesBySlug.length > 0) {
          hospital = potentialMatchesBySlug[0];
          console.log(`[Staff API] Found hospital using slug in settings: ${hospital.name}, id: ${hospital.id}`);
        } else {
          // Find any potential matches (manual case-insensitive check)
          const potentialMatches = allHospitals.filter(h => 
            (h.subdomain && h.subdomain.toLowerCase() === lowercaseHospitalName) ||
            (h.name && h.name.toLowerCase().includes(lowercaseHospitalName)) ||
            (h.code && h.code.toLowerCase() === lowercaseHospitalName)
          );
        
          if (potentialMatches.length > 0) {
            hospital = potentialMatches[0];
            console.log(`[Staff API] Found match using case-insensitive search: ${hospital.name}, id: ${hospital.id}`);
          }
        }
      }
    }
    
    console.log(`[Staff API] Hospital lookup result for '${hospitalName}':`, hospital ? `Found: ${hospital.name} (Subdomain: '${hospital.subdomain}', ID: ${hospital.id})` : 'Not found');

    if (!hospital) {
      return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
    }

    // Get staff for this hospital
    const staff = await prisma.user.findMany({
      where: { 
        hospitalId: hospital.id,
        // Only get staff members (not patients)
        role: {
          in: [UserRole.DOCTOR, UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN]
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialties: true,
        isHospitalAdmin: true,
        photo: true, // This is the profile picture field in the schema
        // We'll need to run a migration later to add these fields
        // For now, we'll handle them through metadata in the app
      },
    });

    // Enhance staff data with metadata from files, if available
    const enhancedStaff = await Promise.all(
      staff.map(async (member) => {
        // Get staff profile info if available
        const staffProfile = await prisma.staffProfile.findUnique({
          where: { userId: member.id }
        }).catch(() => null);
        
        // Extract contact information from StaffProfile if available
        const contactInfo = staffProfile?.contactInformation as Record<string, any> || {};
        
        // Convert photo to profilePicture for frontend compatibility
        const enhancedMember = {
          ...member,
          profilePicture: member.photo,
          // Use StaffProfile fields with fallbacks
          staffId: staffProfile?.staffId || '',
          specialization: staffProfile?.specialization || '',
          qualifications: staffProfile?.qualifications || {},
          joiningDate: staffProfile?.joiningDate || null,
          employmentStatus: staffProfile?.employmentStatus || 'ACTIVE',
          // Extract from contactInformation JSON
          salary: contactInfo.salary || 0,
          taxRate: contactInfo.taxRate || 0,
          address: contactInfo.address || '',
          phone: contactInfo.phone || '',
          gender: contactInfo.gender || null,
          shift: contactInfo.shift || null,
          telemedicineEnabled: member.role === UserRole.DOCTOR ? contactInfo.telemedicineEnabled || false : null,
          onlineBookingEnabled: member.role === UserRole.DOCTOR ? contactInfo.onlineBookingEnabled || false : null,
        };

        // Try to load additional metadata from file
        try {
          const metadataPath = join(process.cwd(), 'data', 'staff-metadata', `${member.id}.json`);
          const fs = require('fs');
          if (fs.existsSync(metadataPath)) {
            const metadataRaw = fs.readFileSync(metadataPath, 'utf8');
            const metadata = JSON.parse(metadataRaw);
            
            // Merge metadata with staff member data
            return {
              ...enhancedMember,
              ...metadata
            };
          }
        } catch (error) {
          console.error(`Failed to load metadata for staff ${member.id}:`, error);
          // Non-blocking, return the member without metadata
        }
        
        return enhancedMember;
      })
    );

    // Create audit log for successful staff list access
    await prisma.securityAuditLog.create({
      data: {
        action: 'STAFF_LIST_ACCESS',
        userId: authResult.user?.id || 'unknown',
        success: true,
        details: `Staff list accessed for hospital ${hospitalName}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
        requestPath: request.nextUrl.pathname,
      }
    }).catch(err => console.error('Failed to log security event:', err));
    
    return NextResponse.json({ staff: enhancedStaff });
    
  } catch (error) {
    console.error("Error getting hospital staff:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/hospitals/[hospitalName]/staff - Create a new staff member
export async function POST(
  request: NextRequest,
  context: { params: { hospitalName: string } }
) {
  // In Next.js App Router, we need to properly handle params
  const { hospitalName } = await Promise.resolve(context.params);
  
  console.log(`[Staff API] Processing POST request to create staff in hospital: ${hospitalName}`);
  
  try {
    // Authenticate request using our staff authentication middleware
    const authResult = await verifyStaffAuth(request, hospitalName);
    console.log('[Staff API][POST] authResult from verifyStaffAuth:', JSON.stringify(authResult, null, 2));
    
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || 'Authentication failed' }, 
      { status: authResult.status || 401 });
    }
    
    // Only hospital admins or super admins should be able to create staff
    if (!(authResult.isHospitalAdmin || authResult.isSuperAdmin || authResult.user?.role === UserRole.ADMIN || authResult.user?.role === UserRole.MANAGER)) {
      // Create audit log for unauthorized attempt
      await prisma.securityAuditLog.create({
        data: {
          action: 'UNAUTHORIZED_STAFF_CREATE_ATTEMPT',
          userId: authResult.user?.id || 'unknown',
          success: false,
          details: `Unauthorized attempt to create staff for hospital ${hospitalName}`,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || undefined,
          requestPath: request.nextUrl.pathname,
        }
      }).catch(err => console.error('Failed to log security event:', err));
      
      return NextResponse.json({ error: 'Access denied: Insufficient privileges to create staff' }, { status: 403 });
    }
    
    // Get form data for multipart/form-data uploads
    const formData = await request.formData();
    
    // Log the action for audit purposes - complying with Hospital Staff Management Security Policy
    if (authResult.user) {
      console.log(`Staff creation initiated by: ${authResult.user.email} (${authResult.user.role})`);
    }

    // Find hospital by name
    // Find the hospital using the methods we know are working from the GET route
    // Log all hospitals in the database for debugging
    const allHospitals = await prisma.hospital.findMany();
    console.log('[Staff API] Available hospitals in the database:');
    // allHospitals already fetched above; use same variable
    allHospitals.forEach((h: any) => {
      console.log(`  - ID: ${h.id}, Name: ${h.name || 'N/A'}, Subdomain: ${h.subdomain || 'N/A'}, Code: ${h.code || 'N/A'}, isActive: ${h.isActive}`);
    });
    
    // Unified hospital lookup
    let hospital = await prisma.hospital.findFirst({
      where: {
        OR: [
          { subdomain: hospitalName },
          { name: hospitalName },
          { code: hospitalName },
        ],
      },
    });

    if (!hospital) {
      // Try case-insensitive search
      const lowercaseHospitalName = hospitalName.toLowerCase();
      
      // Try to find by slug property if it exists
      const potentialMatchesBySlug = allHospitals.filter(h => {
        const settings = h.settings as any;
        return settings && settings.slug && settings.slug.toLowerCase() === lowercaseHospitalName;
      });
      
      if (potentialMatchesBySlug.length > 0) {
        hospital = potentialMatchesBySlug[0];
        console.log(`[Staff API] Found hospital using slug in settings: ${hospital.name}, id: ${hospital.id}`);
      }
    }
    
    // Debug info
    console.log(`[Staff API] Hospital lookup for staff creation: ${hospital ? 'Found' : 'Not found'}`);
    if (hospital) {
      console.log(`[Staff API] Using hospital: ${hospital.name} (ID: ${hospital.id})`);
    }

    if (!hospital) {
      return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
    }
    
    // Extract data from formData
    let jsonData: any = {};
    let profilePictureFile: File | null = null;
    
    // FormData can contain both JSON data and files
    for (const entry of formData.entries()) {
      const [key, value] = entry;
      
      if (key === 'data') {
        // This is our JSON stringified data
        try {
          jsonData = JSON.parse(value as string);
        } catch (e) {
          console.error('Failed to parse JSON data:', e);
          return NextResponse.json({ error: 'Invalid JSON data' }, { status: 400 });
        }
      } else if (key === 'profilePicture' && value instanceof File) {
        profilePictureFile = value;
      }
    }
    
    // Validate the extracted JSON data
    const validationResult = staffSchema.safeParse(jsonData);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const validatedData = validationResult.data;
    
    // Check if email already exists
    const existingUser = await prisma.user.findFirst({
      where: { 
        email: validatedData.email,
      },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    // Generate temporary password and hash it
    const tempPasswordPlain = await generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPasswordPlain, 10);

    // Create user in database
    const newUser = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword, // Properly hashed password
        role: validatedData.role,
        specialties: validatedData.specialties || [],
        hospitalId: hospital.id,
        // Explicitly set as NOT a hospital admin when creating via staff API
        // This adheres to the Hospital Staff Management Security Policy
        isHospitalAdmin: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialties: true,
        isHospitalAdmin: true,
        phone: true,
        photo: true,
        createdAt: true,
      },
    });
    
    // Generate a unique staff ID
    const hospitalPrefix = hospital.name.substring(0, 2).toUpperCase();
    const rolePrefix = validatedData.role.substring(0, 1);
    const staffId = `${hospitalPrefix}-${rolePrefix}${Math.floor(10000 + Math.random() * 90000)}`;

    // TODO: In a production environment, send email with temporary credentials
    console.log(`Email would be sent to ${validatedData.email} with temporary password: ${tempPasswordPlain}`);

    // Create StaffProfile with the contact information containing additional details
    const contactInformation = {
      address: validatedData.address as string || '',
      phone: (validatedData.phone as string) || newUser.phone || '',
      gender: validatedData.gender as string || null,
      shift: validatedData.shift as string || null,
      salary: validatedData.salary || 0,
      taxRate: (validatedData.taxRate as number) || 0,
    };
    
    // Add doctor-specific settings to contact information
    if (validatedData.role === UserRole.DOCTOR) {
      Object.assign(contactInformation, {
        telemedicineEnabled: validatedData.telemedicineEnabled || false,
        onlineBookingEnabled: validatedData.onlineBookingEnabled || false,
      });
    }

    // Create StaffProfile record
    const staffProfile = await prisma.staffProfile.create({
      data: {
        userId: newUser.id,
        hospitalId: hospital.id,
        staffId: staffId,
        specialization: validatedData.specialties?.[0] || '',
        qualifications: {
          degrees: [],
          certifications: [],
          // Additional qualifications can be added later
        },
        joiningDate: new Date(),
        employmentStatus: 'ACTIVE',
        contactInformation: contactInformation,
      },
    });
    
    // Handle profile picture if uploaded
    let photoUrl = null;
    if (profilePictureFile) {
      try {
        // Create directory for profile pictures if it doesn't exist
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'staff');
        await mkdir(uploadDir, { recursive: true });
        
        // Generate unique filename with original extension
        const fileExt = profilePictureFile.name.split('.').pop() || 'jpg';
        const fileName = `${newUser.id}-${Date.now()}.${fileExt}`;
        const filePath = join(uploadDir, fileName);
        
        // Write file to disk
        const fileBuffer = Buffer.from(await profilePictureFile.arrayBuffer());
        await writeFile(filePath, fileBuffer);
        
        // Set the photo URL for the user
        photoUrl = `/uploads/staff/${fileName}`;
        
        // Update user with photo URL
        await prisma.user.update({
          where: { id: newUser.id },
          data: { photo: photoUrl },
        });
      } catch (error) {
        console.error('Failed to save profile picture:', error);
        // Non-blocking, we still want to return the user
      }
    }

    // Create enhanced user response with all the necessary fields for frontend
    const enhancedUser = {
      ...newUser,
      profilePicture: photoUrl || newUser.photo,
      staffId: staffProfile.staffId,
      specialization: staffProfile.specialization,
      salary: (contactInformation as any).salary || 0,
      taxRate: (contactInformation as any).taxRate || 0,
      address: (contactInformation as any).address || '',
      phone: (contactInformation as any).phone || '',
      gender: (contactInformation as any).gender,
      shift: (contactInformation as any).shift,
      employmentStatus: staffProfile.employmentStatus,
      qualifications: staffProfile.qualifications,
      joiningDate: staffProfile.joiningDate,
      // Include doctor-specific settings
      telemedicineEnabled: validatedData.role === UserRole.DOCTOR ? 
        (validatedData.telemedicineEnabled || false) : null,
      onlineBookingEnabled: validatedData.role === UserRole.DOCTOR ? 
        (validatedData.onlineBookingEnabled || false) : null,
    };
    
    // Create security audit log for successful staff creation
    await prisma.securityAuditLog.create({
      data: {
        action: 'STAFF_CREATED',
        userId: authResult.user?.id || 'system',
        success: true,
        details: `Staff member created: ${newUser.name} (${newUser.email}) with role ${newUser.role}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
        requestPath: request.nextUrl.pathname,
      }
    }).catch(err => console.error('Failed to log security event:', err));
    
    return NextResponse.json(enhancedUser, { status: 201 });
    
  } catch (error) {
    console.error("Error creating hospital staff:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to generate a temporary password
async function generateTempPassword(): Promise<string> {
  // Use a fixed temporary password as required in the spec: "123456789"
  // This is for development only - in production, we would generate a secure random password
  return "123456789";
}
